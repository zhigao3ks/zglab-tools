# MCP Server Runtime（Phase 13B）

本文描述 `zglab-tools` 的 MCP Server：把 Phase 13A 的 Shared Tool Core 通过标准 MCP 协议暴露为
一个 localhost/internal、stdio-only、bounded 的机器调用 runtime。

> 权威 Phase 路线见 `zglab-rag` 仓库的 `docs/roadmap-v2.md`。13B 只落地 MCP Server，不实现
> MCP Client（13C）、Agent Planner（14）或公网端点。

## 1. 架构

```text
Shared Tool Core（src/tool-core）
        ↓
MCP Adapter（src/mcp/adapter.ts）
        ↓
MCP Server（src/mcp/server.ts，官方 SDK 底层 Server）
        ↓ stdio
标准 MCP Client（13C 的 zglab-rag）
```

依赖方向被严格限定：

```text
Browser  → src/tools/*/logic.ts
MCP      → src/tool-core → src/tools/*/logic.ts
```

`src/tools/*/logic.ts` 与 `src/tool-core` 不反向依赖 MCP SDK / `node:*`，因此浏览器 build
（`tools.zglab.fun`）与 MCP server 共用同一份确定性逻辑，而 MCP SDK 永不进入浏览器 bundle
（已通过 `dist/` 扫描验证）。

## 2. SDK

- 使用官方 [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
  **1.30.0**（MIT，`node >= 18`，本项目 engines `>=22.12`）。
- 使用 SDK 的底层 `Server` + `StdioServerTransport`，而不是高层的 `McpServer`，原因是：
  `McpServer.registerTool` 要求 Zod schema，而 13A 的契约真相是 **JSON Schema**；底层 `Server`
  的 `tools/list` / `tools/call` 直接消费 raw JSON Schema，避免“JSON Schema + Zod + 手动校验”
  三套 schema drift。这正是 SDK 对底层 `Server` 标注 “advanced use case” 的用法。
- `initialize`、`tools/list`、`tools/call`、JSON-RPC framing 全部由 SDK 完成，本项目不自行
  实现协议；工具 policy、资源上限、安全错误由本项目边界控制，annotation 只是 hint，不是授权。

## 3. Transport（stdio，冻结）

第一版只实现 stdio：

- 不监听 TCP、不引入 express/fastify、无 HTTP server、无 `/mcp` 路由。
- 无公网暴露、无 Nginx、无 MCP HTTP Auth、单 parent process ownership。
- Phase 13C 的 `zglab-rag` 作为 host spawn `node`/`tsx` 启动本进程。

## 4. 启动与进程生命周期

- 开发入口 `src/mcp/cli.ts`（`npm run mcp:server` = `tsx src/mcp/cli.ts`）。
- **生产形状编译产物**：`npm run build:mcp` 用 esbuild 把 `src/mcp/cli.ts` + 共享 tool core
  打成 `dist-mcp/cli.js`（35KB，node_modules 保持 external），运行 `node dist-mcp/cli.js`。
  `dist-mcp/` 与浏览器 `dist/` 严格分离，`gitignore`/tsconfig/eslint/prettier 均已排除，永不
  进入 `tools.zglab.fun` 站点。
- 13C 的 `zglab-rag` Host 优先 spawn `node dist-mcp/cli.js`（不依赖 tsx）。
- 正常 stdin close / SIGTERM / SIGINT → `server.close()` 后 `process.exit(0)`，不挂 zombie、
  不残留 child（本阶段 server 自己不 spawn child）。
- uncaught exception / unhandled rejection → 仅写 stderr，`process.exit(1)`。

> 注意：`npm run mcp:server` 会由 npm 在 stdout 打印一行脚本 banner，只适合人工本地启动。
> 机器调用（13C）直接 spawn `node dist-mcp/cli.js`，其 stdout 严格纯净。

## 5. tools/list

只暴露 `createToolRegistry()` 中显式注册的 **10 个** tool：

```text
json_format, json_minify, json_validate,
base64_encode, base64_decode, url_encode, url_decode,
text_count, text_deduplicate, timestamp_convert
```

每个 tool 返回 `name`（稳定 snake_case id）、`title`（英文短名）、`description`、
`inputSchema`（13A raw JSON Schema）、`annotations`（`readOnlyHint=true`、`destructiveHint=false`、
`idempotentHint=true`、`openWorldHint=false`）。`src/config/tools.ts`（UI 目录）**不是** MCP
allowlist，二者严格分离。

## 6. tools/call

```text
MCP request
   ↓ 官方 SDK 完成 JSON-RPC / initialize
   ↓ handler：registry.execute(name, arguments)
   ↓   （lookup + 输入 size + 窄化校验 + 执行 + 输出 size + 错误归一化）
ToolResult
   ↓ adapter.toCallToolResult
MCP CallToolResult
```

- 无 `eval` / 动态 import / 反射分派 / fuzzy match；未知 tool 由 registry 返回
  `TOOL_NOT_FOUND`（安全拒绝，不 crash、不猜相似名）。
- 工具参数的结构化校验、size 边界、错误归一化全部在 `ToolRegistry.execute` 内。

### 结果映射（machine-facing）

成功：

```json
{
  "content": [{ "type": "text", "text": "<JSON.stringify(output)>" }],
  "structuredContent": { "status": "success", "result": "<raw output>" }
}
```

工具执行失败（返回 `isError: true`）：

```json
{
  "content": [{ "type": "text", "text": "INVALID_INPUT: ..." }],
  "structuredContent": { "status": "error", "code": "INVALID_INPUT", "message": "..." },
  "isError": true
}
```

- `structuredContent.result` 是权威结果（对象或字符串），`content[].text` 是 JSON 兼容层。
- 不向 client 返回 stack、原始 Error、绝对路径、内部函数名。
- **协议错误**（如 JSON-RPC 帧非法）由 SDK transport 处理；**工具执行错误**（用户 JSON 格式
  错误、参数非法等）是 `isError` 结果——不会把用户输入错误变成 server crash。
- `json_validate` 对非法 JSON 返回 `{ valid: false, ... }` 的**成功结果**，不是错误结果。

## 7. Schema（单一真相）

- `inputSchema` 直接复用 13A 的 `JsonSchema`（`src/tool-core/contracts.ts`），不写第二份 Zod。
- `outputSchema` 在 13B 的 `tools/list` 中**刻意不暴露**：MCP `structuredContent` 必须是对象，
  而 10 个工具的输出既有对象也有字符串；为避免 `structuredContent` 与 `outputSchema` 校验
  冲突，权威结果统一走 `structuredContent.result`，每个工具的输出形状继续由 13A 的
  `outputSchema`（tool-core 内 + 文档）作为单一真相。

## 8. 安全错误模型

复用 13A 的 8 个错误码：

```text
INVALID_INPUT / INPUT_TOO_LARGE / OUTPUT_TOO_LARGE / UNSUPPORTED_OPTION /
EXECUTION_TIMEOUT / TOOL_NOT_FOUND / TOOL_DISABLED / INTERNAL_TOOL_ERROR
```

错误只含 code + 安全 message + 可选安全 details，绝不泄露内部信息。

## 9. Resource Bounds

- **第一道（transport）**：`StdioServerTransport` 的 `maxBufferSize = 1 MiB`（SDK 官方支持的
  硬帧上限），超限在 JSON.parse / dispatch 之前就拒绝并关闭，避免“100MB JSON → parse → 才发现
  超限”。
- **第二道（registry）**：每工具 `maxInputBytes = maxOutputBytes = 256 KiB`。

## 10. Timeout 语义（如实记录）

13B **不实现 in-process 抢占**：

- 10 个工具都是有界同步纯函数，执行路径不含网络/文件/循环大输入；
- `timeoutMs`（2000ms）是 **advertised policy，不是硬抢占**。普通 `Promise.race(setTimeout)`
  无法打断同步 CPU loop，为此引入 worker framework 又过度；
- 冻结策略：Registry 有界同步执行 + MCP Host 的 hard process/request deadline 属于 **13C**。

## 11. stdout / stderr

- **stdout 只能写 MCP protocol**：不 `console.log`、无 banner、无 stack（有 `stdio.test.ts`
  与真实 integration test 双重验证）。
- 必要诊断只写 **stderr**。

## 12. 测试与验收

- `src/mcp/adapter.test.ts`：list/result/error 映射单元测试。
- `src/mcp/integration.test.ts`：**真实官方 MCP Client** spawn stdio server，完成
  initialize → tools/list（恰好 10 个、无未批准工具、schema 齐全）→ tools/call（JSON/Base64/
  URL/text/timestamp），以及 unknown tool / extra field / wrong type / missing field / oversize
  input / output overflow / 多顺序调用 / 并发调用。
- `src/mcp/stdio.test.ts`：stdout 启动零输出 + stdin close 干净退出（exit 0）。

## 13. Non-goals / 已知限制

- 不实现 MCP Client、`/api/v2/tool|mcp|agent`、LLM tool calling、Agent Planner、ReAct、
  自动 tool selection、Session memory、public MCP、Streamable HTTP/SSE、Nginx MCP 路由、
  filesystem/shell/GitHub/SSH/deploy/browser automation。
- 无 API key / DB / Cookie / SSH / dotenv；`node dist/mcp/server.js` 即可运行（当前经 tsx）。
- 超时非硬抢占（见 §10）；13D 前不得宣称“生产安全 Gate 已完全完成”。

## 14. Phase 13C 边界

13C 才在 `zglab-rag` 建立 MCP Client 并 spawn 本 server；届时补齐 hard process/request
deadline、`MCPToolCapability` 集成与调用审计。本阶段不触碰 `zglab-rag` 的产品调用链。
