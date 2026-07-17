#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${PUBLIC_SITE_URL:?请设置 PUBLIC_SITE_URL，例如 https://tools.example.com}"
: "${DEPLOY_SERVER:?请设置 DEPLOY_SERVER，例如 ubuntu@example.com}"
DEPLOY_ROOT="${DEPLOY_ROOT-/var/www/tools.zglab.fun}"
DEPLOY_TMP="${DEPLOY_TMP-/tmp/zglab-tools-dist}"
DEPLOY_BACKUP_ROOT="${DEPLOY_BACKUP_ROOT-/var/backups/tools.zglab.fun}"
: "${DEPLOY_BACKUP_KEEP:=10}"

validate_deploy_path() {
  local variable_name="$1"
  local value="$2"
  local required_prefix="$3"
  local prefix_root="${required_prefix%/}"

  if [[ -z "$value" || "$value" == "/" || "$value" == "$prefix_root" || "$value" == "$required_prefix" ]]; then
    echo "${variable_name} 不能为空、根目录或 ${prefix_root} 本身。" >&2
    return 1
  fi
  if [[ "$value" != "${required_prefix}"* ]]; then
    echo "${variable_name} 必须位于 ${required_prefix} 下。" >&2
    return 1
  fi
  if
    [[ ! "$value" =~ ^/[A-Za-z0-9._/-]+$ ]] ||
      [[ "$value" =~ (^|/)\.{1,2}(/|$) ]] ||
      [[ "$value" == *"//"* ]]
  then
    echo "${variable_name} 包含危险或不受支持的路径片段：${value}" >&2
    return 1
  fi
}

validate_deploy_path "DEPLOY_ROOT" "$DEPLOY_ROOT" "/var/www/"
validate_deploy_path "DEPLOY_TMP" "$DEPLOY_TMP" "/tmp/"
validate_deploy_path "DEPLOY_BACKUP_ROOT" "$DEPLOY_BACKUP_ROOT" "/var/backups/"

DEPLOY_ROOT="${DEPLOY_ROOT%/}"
DEPLOY_TMP="${DEPLOY_TMP%/}"
DEPLOY_BACKUP_ROOT="${DEPLOY_BACKUP_ROOT%/}"
PUBLIC_SITE_URL="${PUBLIC_SITE_URL%/}"

if [[ ! "$DEPLOY_BACKUP_KEEP" =~ ^[1-9][0-9]*$ ]]; then
  echo "DEPLOY_BACKUP_KEEP 必须是大于 0 的整数。" >&2
  exit 1
fi
if [[ ! "$DEPLOY_SERVER" =~ ^[A-Za-z0-9._-]+@[A-Za-z0-9._:-]+$ ]]; then
  echo "DEPLOY_SERVER 必须使用安全的 user@host 格式。" >&2
  exit 1
fi
if [[ ! "$PUBLIC_SITE_URL" =~ ^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~/-]*)?$ ]]; then
  echo "PUBLIC_SITE_URL 必须是完整的 http:// 或 https:// 站点地址，且不能包含查询参数或片段。" >&2
  exit 1
fi

for command_name in npm rsync ssh; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "缺少必要命令：$command_name" >&2
    exit 1
  fi
done

echo "[1/8] 安装锁定依赖"
npm ci

echo "[2/8] 检查代码格式"
npm run format:check

echo "[3/8] 运行 ESLint"
npm run lint

echo "[4/8] 运行 Astro Check"
npm run check

echo "[5/8] 运行单元测试"
npm run test

echo "[6/8] 生成静态站点"
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "构建产物缺少 dist/index.html，停止部署。" >&2
  exit 1
fi
expected_health_artifact="$(printf 'zglab-tools-ok\n\x1f')"
actual_health_artifact="$(cat dist/health.txt; printf '\x1f')"
if [[ "$actual_health_artifact" != "$expected_health_artifact" ]]; then
  echo "构建产物缺少有效的 dist/health.txt，停止部署。" >&2
  exit 1
fi

backup_name="$(date -u +'%Y%m%dT%H%M%SZ')"

echo "[7/8] 检查远程目录并上传临时目录"
ssh "$DEPLOY_SERVER" bash -s -- \
  "$DEPLOY_ROOT" \
  "$DEPLOY_TMP" \
  "$DEPLOY_BACKUP_ROOT" <<'REMOTE_PREPARE'
set -Eeuo pipefail

deploy_root="$1"
deploy_tmp="$2"
backup_root="$3"

for command_name in rsync curl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "远程服务器缺少必要命令：${command_name}" >&2
    exit 1
  fi
done

for directory in "$deploy_root" "$backup_root"; do
  if [[ ! -d "$directory" || ! -w "$directory" || ! -x "$directory" ]]; then
    echo "目录不存在或部署用户无写入权限：${directory}" >&2
    echo "请先按照 docs/deployment.md 完成一次性服务器目录授权。" >&2
    exit 1
  fi
done

mkdir -p "$deploy_tmp"
if [[ ! -w "$deploy_tmp" || ! -x "$deploy_tmp" ]]; then
  echo "部署用户无法使用远程临时目录：${deploy_tmp}" >&2
  exit 1
fi
REMOTE_PREPARE

rsync -az \
  --delete \
  --chmod=D755,F644 \
  --human-readable \
  dist/ "${DEPLOY_SERVER}:${DEPLOY_TMP}/"

echo "[8/8] 备份、覆盖发布、健康检查并清理旧备份"
ssh "$DEPLOY_SERVER" bash -s -- \
  "$DEPLOY_ROOT" \
  "$DEPLOY_TMP" \
  "$DEPLOY_BACKUP_ROOT" \
  "$backup_name" \
  "$DEPLOY_BACKUP_KEEP" \
  "$PUBLIC_SITE_URL" <<'REMOTE_DEPLOY'
set -Eeuo pipefail
umask 022

deploy_root="$1"
deploy_tmp="$2"
backup_root="$3"
backup_name="$4"
backup_keep="$5"
public_site_url="$6"
backup_dir="${backup_root}/${backup_name}"
health_url="${public_site_url%/}/health.txt"
health_body_file=""
had_previous=false
published=false

cleanup_health_file() {
  if [[ -n "$health_body_file" && -f "$health_body_file" ]]; then
    rm -f -- "$health_body_file"
  fi
}

rollback() {
  local status=$?
  cleanup_health_file
  if [[ "$published" == true ]]; then
    echo "发布失败，正在从部署前备份恢复。" >&2
    rsync -a --delete --chmod=D755,F644 "${backup_dir}/" "${deploy_root}/" || true
  fi
  exit "$status"
}
trap rollback ERR

if [[ ! -f "${deploy_tmp}/index.html" ]]; then
  echo "远程临时目录中缺少 index.html。" >&2
  exit 1
fi
expected_health_artifact="$(printf 'zglab-tools-ok\n\x1f')"
actual_health_artifact="$(cat "${deploy_tmp}/health.txt"; printf '\x1f')"
if [[ "$actual_health_artifact" != "$expected_health_artifact" ]]; then
  echo "远程临时目录中缺少有效的 health.txt。" >&2
  exit 1
fi

mkdir "$backup_dir"
shopt -s nullglob dotglob
existing_entries=("${deploy_root}"/*)
shopt -u nullglob dotglob
if ((${#existing_entries[@]} > 0)); then
  had_previous=true
  rsync -a "${deploy_root}/" "${backup_dir}/"
fi

published=true
rsync -a --delete --chmod=D755,F644 "${deploy_tmp}/" "${deploy_root}/"

health_body_file="$(mktemp "${deploy_tmp}/health-response.XXXXXX")"
health_status="$(
  curl \
    --silent \
    --show-error \
    --max-time 15 \
    --output "$health_body_file" \
    --write-out '%{http_code}' \
    "$health_url"
)"
health_body="$(cat "$health_body_file"; printf '\x1f')"
cleanup_health_file

if [[ "$health_status" != "200" ]]; then
  echo "健康检查失败：${health_url} 返回 HTTP ${health_status}，要求严格返回 200。" >&2
  false
fi
if [[ "$health_body" != "$expected_health_artifact" ]]; then
  echo "健康检查失败：${health_url} 响应正文不匹配。" >&2
  false
fi

mapfile -d '' backup_directories < <(
  find "$backup_root" \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    -name '20??????T??????Z' \
    -print0 |
    sort -z -r
)

for ((index = backup_keep; index < ${#backup_directories[@]}; index += 1)); do
  candidate="${backup_directories[$index]}"
  if [[ "$(dirname -- "$candidate")" != "$backup_root" ]]; then
    echo "拒绝清理不属于备份根目录直接子目录的路径：${candidate}" >&2
    false
  fi
  rm -rf -- "$candidate"
done

if [[ "$had_previous" == false ]]; then
  rmdir "$backup_dir"
fi

trap - ERR
echo "远程覆盖发布和健康检查成功。"
if [[ "$had_previous" == true ]]; then
  echo "部署前备份：${backup_dir}"
else
  echo "首次部署，没有旧站点需要保留。"
fi
echo "备份保留上限：${backup_keep}"
REMOTE_DEPLOY

echo "部署完成：${PUBLIC_SITE_URL}"
