# ZGLab Tools

ZGLab Tools 是 `tools.zglab.fun` 的静态工具平台：本地优先、打开即用、数据不离开浏览器。目前包含 39 个工具，覆盖开发数据、图片、文本增强、前端设计与科研辅助。

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
│   │   └── tools/           # 各工具的 Preact island
│   ├── config/              # 站点、导航、功能和工具注册
│   ├── layouts/             # SEO 与全局布局
│   ├── pages/               # 首页、专属工具页、配置驱动工具页、隐私页、404
│   ├── styles/              # Token、全局、组件和工具样式
│   ├── tools/               # 每个工具的纯逻辑、类型与测试
│   ├── tool-core/           # 机器可调用的 Shared Tool Core（Phase 13A，见 docs/mcp-tools.md）
│   ├── types/               # 平台通用类型
│   └── utils/               # 剪贴板、下载、存储和文本辅助
├── templates/minimal-tool/ # 可复制的最小工具示例
├── docs/                    # 新增工具与部署文档
└── scripts/deploy.sh        # 检查、构建、备份、发布与验证
```

## 已有工具

1. JSON 格式化器：使用 Web Worker 执行格式化、压缩、校验、错误定位和键名排序，并支持复制与 JSON 下载。
2. 时间戳转换器：实时浏览器时钟、秒/毫秒识别、UTC、本地与 IANA 时区转换。
3. 文本统计器：Unicode 感知字符、中文、英文、行、段落、UTF-8 字节和阅读时间。
4. 文本去重与排序：Trim、空行策略、保留首/末重复项、自然/数字/字典序、随机和反转。
5. 二维码生成器：文本、URL、邮箱、电话、Wi-Fi，支持本地 PNG/SVG 下载和对比度提示。
6. Base64 编解码：UTF-8 文本与 Base64 互转，支持中文、Emoji、本地文件编码和二进制下载。
7. URL 编解码：`encodeURI`、`encodeURIComponent`、解码、URL 解析与 Query 参数查看。
8. UUID 生成器：基于 Web Crypto 批量生成 UUID v4，支持复制、下载与已有 UUID 去重。
9. 文本对比工具：左右文本实时比较，突出新增与删除内容；长文本自动降级为按行比较。
10. 正则表达式测试：实时匹配、捕获分组、替换结果和常用模板。
11. JWT 解码器：本地解码 Header、Payload、Signature，并检查 `exp` 过期状态；不验证签名。
12. 哈希计算工具：本地计算文本或文件的 MD5、SHA-1、SHA-256、SHA-512。
13. Markdown 预览：左侧编辑，右侧安全实时渲染常用 Markdown 语法，不执行原始 HTML。

### 图片工具

14. 图片压缩：Canvas 本地压缩，支持输出格式、质量和体积变化预览。
15. 图片尺寸调整：按像素调整宽高并保持比例。
16. PNG/JPG/WebP 转换：本地格式与质量转换。
17. 图片裁剪：按像素边界裁剪。
18. 图片圆角处理：生成透明圆角 PNG。
19. 图片转 Base64：生成可复制的 Data URL。
20. ICO 图标生成：从中心正方形图像生成 PNG 封装 ICO。
21. 图片取色器：点击像素读取 HEX、RGB、HSL。

### 文本与设计工具

22. 大小写转换、23. 命名转换、24. 空格和空行清理、25. 查找替换。
23. 随机字符串生成、27. Lorem Ipsum 生成、28. URL/邮箱/手机号提取、29. 隐藏字符检测。
24. HEX/RGB/HSL 转换、31. 颜色选择器、32. 渐变色生成器。
25. CSS 阴影生成器、34. CSS 圆角生成器、35. REM/PX 转换、36. 屏幕尺寸与比例计算。

### 特色化工具

37. Token 数量估算：按文本构成提供三种本地启发式估算参考。
38. DOI 检查与参考文献转换：规范化 DOI，并输出 GB/T 7714、APA 7、BibTeX。
39. 实验数据图表：从 CSV/TSV 生成本地折线图、散点图、柱状图和 PNG。

文本排序已由“文本去重与排序”工具提供，支持字典、自然、数字和反向排序。

## 配置驱动

`src/config/tools.ts` 是工具目录的唯一注册表。首页列表、分类搜索、顶部工具菜单和相关工具推荐都从它读取。

- `visible: false` 会从首页、搜索和导航隐藏。
- `planned` 或 `disabled` 可以展示状态，但不会提供不可用入口。
- 标准工具会由 `[tool].astro` 构建为独立静态路由；只有特殊布局才需要单独 Astro 页面。

新增工具的最短步骤：

1. 新建 `src/tools/<id>/` 的逻辑、类型和测试。
2. 新建 island，或为 `ImageTool`、`TextEnhancer`、`DesignTool` 添加一个受控模式。
3. 在 `src/config/tools.ts` 注册工具，并在 `src/config/tool-pages.ts` 填写使用说明和 FAQ。
4. 若使用共享 island，在 `ToolIslandDispatcher.tsx` 增加一条受限映射；特殊页面才新建 `src/pages/*.astro`。
5. 执行 lint、check、test 和 build。

首页、搜索、导航和 sitemap 会在构建时自动包含注册后的路由；不需要额外部署服务或改动 Nginx。完整字段与边界说明见 [docs/adding-a-tool.md](docs/adding-a-tool.md)。

## 隐私与本地存储

- 输入正文只存在于当前页面组件状态中。
- 主题与最近使用工具 ID 等非敏感偏好可以写入 localStorage。
- Clipboard API 不可用时使用隐藏 textarea 进行兼容复制。
- 下载使用本地 Blob/Object URL，并在触发后释放 URL。
- 二维码内容不会自动打开，也不会通过 `innerHTML` 渲染。
- 项目不使用 `eval` 或 `new Function`。

## MCP Tool Core 与 MCP Server（Phase 13A/13B/13C）

为了未来让 Agent 通过 MCP 调用受控的确定性工具，项目新增了机器可调用的 Shared Tool Core
（`src/tool-core/`，Phase 13A）并在其上实现了 stdio-only 的 MCP Server（`src/mcp/`，Phase
13B），再由 `zglab-rag` 的 Python Host 经官方 MCP client 以 stdio 调用（Phase 13C）。这些层只
import 既有 `src/tools/*/logic.ts` 纯逻辑，不复制算法、不暴露 UI 组件，用窄化的 typed/bounded
contract（Tool Contract + Tool Registry + JSON Schema + 资源上限 + 安全错误模型）包裹了 10 个
deterministic pure tool（JSON / Base64 / URL / text / timestamp），并通过官方 MCP Client 的真实
stdio integration test 验证 `initialize` / `tools/list` / `tools/call`。浏览器工具站行为保持
不变，现有 UI 测试零回归，MCP SDK / `node:*` 不进入浏览器 bundle。

```bash
npm run mcp:server   # 本地启动 stdio MCP Server（tsx src/mcp/cli.ts）
npm run build:mcp    # 编译生产产物 dist-mcp/cli.js 与 dist-mcp/manifest.json
```

`dist-mcp/` 是独立 Node 22 ESM bundle：不依赖 `tsx`、`src/` 或本仓库的
`node_modules`，不能放入 Astro 的 `dist/` 或 `/var/www/` 静态站点。manifest 仅记录
server 名、版本、source commit 与 10 个工具的数量，不含本地路径或 secret。

这是 Phase 13A（Tool Core Boundary & MCP Contract Foundation）、Phase 13B（MCP Server
Runtime）与 Phase 13C（MCP Client + Capability Integration，由 `zglab-rag` 侧实现）的落地。
边界、入选/不入选工具与错误模型见 [docs/mcp-tools.md](docs/mcp-tools.md)，MCP Server 设计见
[docs/mcp-server.md](docs/mcp-server.md)。

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
- 正则测试会在浏览器主线程运行，复杂回溯模式在超长文本上可能较慢。
- JWT 工具只解码，不校验签名、发行方或权限；Markdown 预览刻意不支持原始 HTML 与外部图片。
- 本地运行不能防止恶意浏览器扩展、输入法或设备级恶意软件读取页面内容。
