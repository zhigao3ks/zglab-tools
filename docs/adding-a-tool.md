# 新增工具指南

ZGLab Tools 将工具目录配置、纯逻辑、交互组件和页面路由分开维护。首页列表、搜索、分类和顶部工具菜单都读取 `src/config/tools.ts`，因此新增工具不需要修改首页布局。标准工具路由由 `src/pages/[tool].astro` 在构建时生成独立静态页面。

## 最短流程

1. 在 `src/tools/<tool-id>/` 新建 `logic.ts`、`types.ts` 和 `logic.test.ts`。
2. 在 `src/components/tools/` 新建一个 Preact island，或扩展同类共享 island；它只负责状态和交互，导入纯逻辑函数。
3. 在 `src/config/tools.ts` 注册一条 `ToolDefinition`，并在 `src/config/tool-pages.ts` 增加说明和 FAQ。
4. 为共享 island 在 `ToolIslandDispatcher.tsx` 增加一个显式 `toolId → mode` 映射。只有需要特殊布局时才在 `src/pages/` 新建专属 Astro 页面。
5. 添加覆盖正常、边界和错误输入的 Vitest 测试。
6. 执行 `npm run lint && npm run check && npm run test && npm run build`。

仓库中的 `templates/minimal-tool/` 提供一个可以完整运行的“文本规范化”示例。它不会参与当前生产构建，复制时请将文件放入上述实际目录。

## 注册字段

```ts
{
  id: 'base64-codec',
  name: 'Base64 编解码',
  shortName: 'Base64',
  description: '在浏览器本地进行文本与 Base64 转换。',
  route: '/base64-codec/',
  category: 'format',
  status: 'online',
  featured: false,
  order: 6,
  keywords: ['Base64', 'encode', 'decode', '编码', '解码'],
  icon: '/icons/base64.svg',
  privacyMode: 'local-only',
  visible: true,
}
```

- `visible: false`：首页、搜索和工具导航均隐藏。
- `status: planned | disabled`：可以显示状态，但配置生成的卡片不会提供可用链接。
- `status: online | beta`：出现在可用工具目录和相关工具推荐中。
- `order`：控制首页、菜单及可用工具的基础顺序。
- `keywords`：同时写中文功能词和英文技术词，以改善本地搜索。

## 逻辑与 UI 边界

纯逻辑应满足：

- 不访问 `window`、DOM 或 localStorage。
- 输入和输出使用明确的 TypeScript 类型。
- 对非法输入返回可展示的错误，而不是仅写 `console.log`。
- 关键算法可以在 Node 环境下由 Vitest 直接测试。

Preact island 负责：

- 输入状态、配置状态和用户反馈。
- 调用纯逻辑并展示结果。
- 复制、Blob 下载和必要的浏览器 API。
- 不把用户正文写入 localStorage 或日志。

## 上线与扩展边界

新增工具的页面、图标和前端逻辑会一起打入 `dist/`，不需要新增后端接口、环境变量、Nginx location 或单独的部署步骤。只要在 `src/config/tools.ts` 注册为 `online`，首页搜索、工具数量、相关工具与静态 sitemap 都会在下一次 `npm run build` 时自动更新。

第二批和第三批工具可以作为实现参考：

- 文本与数据转换：`base64`、`url`、`jwt` 的逻辑会返回可展示的错误，而不是在组件中直接处理异常。
- 有 Web API 的功能：`uuid`、`hash`、文件 Base64 在 island 中调用浏览器 API，纯逻辑仍可单测。
- 实时输出：`text-diff`、`regex`、`markdown` 使用受控状态和纯解析函数，不通过 `innerHTML` 注入用户输入。
- 图片处理：`ImageTool` 统一封装 File、Canvas、Blob 和本地下载；尺寸、裁剪和 ICO 格式在 `src/tools/image/` 中测试。
- 文本与设计：`TextEnhancer`、`DesignTool` 将多个相近工具收敛为受限模式，减少复制代码但仍为每项功能生成单独静态 URL。
- 特色化工具：Token、DOI 与实验图表各自保留可测试的纯逻辑；图表渲染使用 Canvas，不依赖远程图表服务。

因此，后续优先沿用“逻辑目录 + 测试 + island + 注册项 + 页面内容/分发映射”的边界；不要为单个工具添加专属服务端或将正文放入 `.env`、localStorage。

Astro 页面（专属页面或 `[tool].astro`）负责：

- 独立的 title、description、canonical 与 Open Graph 元信息。
- 工具介绍、使用说明、FAQ 和相关工具。
- 使用 `client:load` 只激活当前工具的 Preact island。

## 上线前清单

- 工具可以在断网环境下完成核心处理。
- 没有请求后端或第三方 CDN。
- 空输入、超长输入和非法输入都有明确行为。
- 所有复制与下载按钮实际可用。
- 手机端输入、配置和输出重新排版后仍可操作。
- `npm run format:check`、lint、check、test、build 全部通过。
