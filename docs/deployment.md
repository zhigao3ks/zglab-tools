# 静态部署说明

ZGLab Tools 使用 Astro 静态输出，生产产物位于 `dist/`。Nginx 只负责读取静态文件，不需要常驻 Node.js 服务。日常发布采用“部署前备份、rsync 覆盖发布和失败回滚”，不是真正的原子发布。

## 首次服务器准备

Ubuntu 24.04 上安装 Nginx、rsync 和健康检查需要的 curl：

```bash
sudo apt update
sudo apt install -y nginx rsync curl
```

由管理员一次性创建站点目录和备份目录，并授权给部署用户。默认部署用户为 `ubuntu`，Nginx 通过 `www-data` 组读取：

```bash
sudo install -d -o ubuntu -g www-data -m 0755 \
  /var/www/tools.zglab.fun \
  /var/backups/tools.zglab.fun
```

如果目录已经存在且包含旧文件，可在首次切换部署方案时由管理员执行一次：

```bash
sudo chown -R ubuntu:www-data \
  /var/www/tools.zglab.fun \
  /var/backups/tools.zglab.fun
sudo find /var/www/tools.zglab.fun /var/backups/tools.zglab.fun -type d -exec chmod 755 {} +
sudo find /var/www/tools.zglab.fun /var/backups/tools.zglab.fun -type f -exec chmod 644 {} +
```

以上 sudo 操作只用于首次准备。准备完成后，日常部署脚本不使用 sudo、不重复 chown，也不修改 Nginx 配置。发布时 rsync 使用目录 `755`、文件 `644`，足够 Nginx 读取。

若使用其他部署账户，请同时调整 `DEPLOY_SERVER` 和上述目录所有者。

## Nginx 配置

创建 `/etc/nginx/sites-available/tools.zglab.fun`：

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name tools.zglab.fun;

    root /var/www/tools.zglab.fun;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    location /_astro/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

首次启用或以后修改 Nginx 配置时执行：

```bash
sudo ln -sfn \
  /etc/nginx/sites-available/tools.zglab.fun \
  /etc/nginx/sites-enabled/tools.zglab.fun
sudo nginx -t
sudo systemctl reload nginx
```

静态文件日常更新不需要执行 `nginx -t` 或 reload。DNS 生效后，使用 Certbot 或现有证书管理方案启用 HTTPS；证书、私钥和 Token 不得放入仓库或前端环境变量。

## 部署变量

复制示例并按环境修改：

```bash
cp .env.example .env
```

示例：

```dotenv
PUBLIC_SITE_URL=https://tools.zglab.fun
DEPLOY_SERVER=ubuntu@124.223.48.17
DEPLOY_ROOT=/var/www/tools.zglab.fun
DEPLOY_TMP=/tmp/zglab-tools-dist
DEPLOY_BACKUP_ROOT=/var/backups/tools.zglab.fun
DEPLOY_BACKUP_KEEP=10
```

变量说明：

- `PUBLIC_SITE_URL`：公开站点完整地址。脚本使用它请求 `/health.txt`，并在成功后原样输出，不会补写协议。
- `DEPLOY_SERVER`：SSH 目标，使用 `user@host` 格式，默认部署用户建议使用 `ubuntu`。
- `DEPLOY_ROOT`：站点目录，必须是 `/var/www/` 下的非根子目录。
- `DEPLOY_TMP`：远程上传临时目录，必须是 `/tmp/` 下的非根子目录。
- `DEPLOY_BACKUP_ROOT`：部署备份目录，必须是 `/var/backups/` 下的非根子目录。
- `DEPLOY_BACKUP_KEEP`：成功发布后保留的最近备份数量，默认 `10`，必须是大于 0 的整数。

脚本会拒绝空路径、`/`、前缀根目录本身、`.`、`..`、重复斜杠、非安全路径字符和不在规定前缀下的路径。

`.env` 已被 Git 忽略。`.env.example` 和 `PUBLIC_` 变量都会被视为公开配置，不得写入密码、SSH 私钥、Token 或私有 API Key。

## 健康检查

`public/health.txt` 会构建为 `dist/health.txt`，固定正文为：

```text
zglab-tools-ok
```

发布后，脚本请求：

```text
${PUBLIC_SITE_URL}/health.txt
```

检查同时要求：

1. HTTP 状态码严格等于 `200`。
2. 响应正文严格等于 `zglab-tools-ok`。

curl 不跟随重定向，因此 301、302、错误页或其他正文都会触发失败回滚。

## 执行部署

```bash
./scripts/deploy.sh
```

本地检查严格按以下顺序执行：

```bash
npm ci
npm run format:check
npm run lint
npm run check
npm run test
npm run build
```

完整流程：

1. 安装锁定依赖并依次完成格式、lint、类型、测试和构建检查。
2. 检查 `dist/index.html` 和 `dist/health.txt`。
3. 验证远程站点目录与备份目录已存在，且部署用户可写。
4. 将 `dist/` 同步到 `/tmp/` 下的远程临时目录。
5. 将当前站点备份到 `DEPLOY_BACKUP_ROOT` 的 UTC 时间戳直接子目录。
6. 使用 `rsync --delete` 覆盖发布到站点目录。
7. 验证 `/health.txt` 的状态码和正文。
8. 失败时从本次部署前备份覆盖回滚；成功后清理超出保留数量的旧备份。

备份清理只扫描 `DEPLOY_BACKUP_ROOT` 的直接子目录，并且只处理形如 `20260717T120000Z` 的时间戳目录，不会递归搜索其他位置。

## 手动回滚

查看现有备份：

```bash
ssh ubuntu@server.example.com \
  'find /var/backups/tools.zglab.fun -mindepth 1 -maxdepth 1 -type d -printf "%f\n" | sort -r'
```

选择目标备份后，以部署用户执行覆盖恢复：

```bash
ssh ubuntu@server.example.com \
  'rsync -a --delete --chmod=D755,F644 /var/backups/tools.zglab.fun/20260717T120000Z/ /var/www/tools.zglab.fun/'
```

静态文件回滚不需要修改或重新加载 Nginx。回滚完成后应再次验证：

```bash
curl --silent --show-error https://tools.zglab.fun/health.txt
```

若要让后续部署持续使用旧版本，还应在本地仓库切换到对应提交并重新构建。
