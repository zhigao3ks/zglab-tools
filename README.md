# ZGLab Tools

ZGLab Tools 是 `tools.zglab.fun` 的静态工具平台：本地优先、打开即用、数据不离开浏览器。首版包含 JSON 格式化、时间戳转换、文本统计、文本按行去重排序和二维码生成五个工具。

所有工具都在浏览器本地运行。项目没有数据库、登录、后端接口、广告、Cookie 追踪或第三方分析；工具输入正文不会写入 localStorage。

## 技术栈

- Astro 7：静态路由、页面布局、SEO 和生产构建。
- TypeScript 6：严格类型检查。
- Preact 10：只在首页搜索与具体工具页面激活交互 island。
- qrcode：由 `src/tools/qrcode/logic.ts` 封装的本地二维码生成。
- Vitest：核心逻辑单元测试。
- ESLint、Prettier、Astro Check：代码质量和格式检查。
- 原生 CSS：设计 Token、深浅主题、响应式和无障碍样式。

依赖使用精确版本并由 `package-lock.json` 锁定。

## 环境要求

- Node.js 22.12 或更高版本
- npm 10 或更高版本
- 生产部署需要 SSH；远程服务器需要 Nginx、rsync 和 curl

## 本地开发

```bash
cd /home/zhigao/projects/zglab-tools
npm ci
npm run dev
```

默认开发地址为 `http://localhost:4321`。

## 质量检查与构建

```bash
npm run format:check
npm run lint
npm run check
npm run test
npm run build
npm run preview
```

构建结果写入 `dist/`，可以直接作为 Nginx 站点根目录。

| 脚本                   | 作用                       |
| ---------------------- | -------------------------- |
| `npm run dev`          | 启动 Astro 开发服务器      |
| `npm run build`        | 生成静态站点               |
| `npm run preview`      | 本地预览 `dist/`           |
| `npm run lint`         | 执行 ESLint                |
| `npm run check`        | 执行 Astro/TypeScript 检查 |
| `npm run test`         | 单次运行 Vitest            |
| `npm run test:watch`   | 监听模式运行 Vitest        |
| `npm run format`       | 使用 Prettier 写入格式     |
| `npm run format:check` | 检查格式但不修改           |

## 项目结构

```text
zglab-tools/
├── public/                  # favicon、robots.txt、本地 SVG 图标、health.txt
├── src/
│   ├── components/
│   │   ├── common/          # 通用 Preact 操作组件
│   │   ├── layout/          # Astro 页头、页脚、工具布局
│   │   └── tools/           # 五个 Preact 工具 island
│   ├── config/              # 站点、导航、功能和工具注册
│   ├── layouts/             # SEO 与全局布局
│   ├── pages/               # 首页、工具页、隐私页、404
│   ├── styles/              # Token、全局、组件和工具样式
│   ├── tools/               # 每个工具的纯逻辑、类型与测试
│   ├── types/               # 平台通用类型
│   └── utils/               # 剪贴板、下载、存储和文本辅助
├── templates/minimal-tool/ # 可复制的最小工具示例
├── docs/                    # 新增工具与部署文档
└── scripts/deploy.sh        # 检查、构建、备份、发布与验证
```

## 首批工具

1. JSON 格式化器：使用 Web Worker 执行格式化、压缩、校验、错误定位和键名排序，并支持复制与 JSON 下载。
2. 时间戳转换器：实时浏览器时钟、秒/毫秒识别、UTC、本地与 IANA 时区转换。
3. 文本统计器：Unicode 感知字符、中文、英文、行、段落、UTF-8 字节和阅读时间。
4. 文本去重与排序：Trim、空行策略、保留首/末重复项、自然/数字/字典序、随机和反转。
5. 二维码生成器：文本、URL、邮箱、电话、Wi-Fi，支持本地 PNG/SVG 下载和对比度提示。

## 配置驱动

`src/config/tools.ts` 是工具目录的唯一注册表。首页列表、分类搜索、顶部工具菜单和相关工具推荐都从它读取。

- `visible: false` 会从首页、搜索和导航隐藏。
- `planned` 或 `disabled` 可以展示状态，但不会提供不可用入口。
- 工具页面本身仍需单独创建 Astro 路由和对应 island。

新增第六个工具的最短步骤：

1. 新建 `src/tools/<id>/` 的逻辑、类型和测试。
2. 新建 `src/components/tools/<Tool>.tsx`。
3. 新建 `src/pages/<route>.astro`。
4. 在 `src/config/tools.ts` 注册。
5. 执行 lint、check、test 和 build。

完整字段与边界说明见 [docs/adding-a-tool.md](docs/adding-a-tool.md)。

## 隐私与本地存储

- 输入正文只存在于当前页面组件状态中。
- 主题与最近使用工具 ID 等非敏感偏好可以写入 localStorage。
- Clipboard API 不可用时使用隐藏 textarea 进行兼容复制。
- 下载使用本地 Blob/Object URL，并在触发后释放 URL。
- 二维码内容不会自动打开，也不会通过 `innerHTML` 渲染。
- 项目不使用 `eval` 或 `new Function`。

## 部署

首次部署前，管理员在 Ubuntu 24.04 服务器安装依赖，并将站点目录和备份目录一次性授权给部署用户。默认部署用户为 `ubuntu`，Nginx 用户组为 `www-data`：

```bash
sudo apt update
sudo apt install -y nginx rsync curl
sudo install -d -o ubuntu -g www-data -m 0755 \
  /var/www/tools.zglab.fun \
  /var/backups/tools.zglab.fun
```

日常部署不使用 sudo，不修改 Nginx 配置，也不重复执行 chown。复制本地配置：

```bash
cp .env.example .env
```

确认 `PUBLIC_SITE_URL`、SSH 目标和目录配置后运行：

```bash
./scripts/deploy.sh
```

脚本依次执行 `npm ci`、格式检查、lint、Astro Check、测试和构建，然后上传远程临时目录，部署前备份、使用 `rsync --delete` 覆盖发布，并请求 `${PUBLIC_SITE_URL}/health.txt`。健康检查只接受 HTTP 200 且正文严格匹配 `zglab-tools-ok`，失败时从本次备份回滚。成功后默认只保留最近 10 个备份。

脚本会拒绝空路径、根目录、`.`、`..`、重复斜杠和越界路径；站点、临时目录与备份目录必须分别位于 `/var/www/`、`/tmp/` 和 `/var/backups/` 下。详细服务器配置和回滚方式见 [docs/deployment.md](docs/deployment.md)。

## 已知边界

- 工具运行速度和可处理数据量取决于用户设备与浏览器；JSON 超过 1 MB 时仅提示，不强制拦截。
- 时区列表优先使用 `Intl.supportedValuesOf('timeZone')`，旧浏览器使用常用时区降级列表。
- 阅读时间是按可配置速度计算的估算值。
- 二维码容量取决于 UTF-8 字节数和纠错等级，工具使用保守容量校验。
- 本地运行不能防止恶意浏览器扩展、输入法或设备级恶意软件读取页面内容。
