# MCP Tools（Phase 13A）— Shared Tool Core

本文档描述 `zglab-tools` 如何在不改变浏览器工具行为的前提下，把一小部分确定性纯逻辑提升为
机器可调用的 **Shared Tool Core**，供未来 Phase 13B 的 MCP Server 复用。

> 权威 Phase 路线见 `zglab-rag` 仓库的 `docs/roadmap-v2.md`。Phase 13A 冻结
> Tool Core / Contract / Registry / schema；Phase 13B 已在其上实现 stdio MCP Server
> （见 `docs/mcp-server.md`）。MCP Client（13C）与 Agent Router（14）尚未实现。

## 1. 边界：Browser UI 与 Machine Runtime 共享同一份逻辑

```text
Browser UI（Preact island）
        │  调用
        ▼
src/tools/<id>/logic.ts   ← 纯逻辑（无 DOM、无 Preact）
        ▲
        │  复用（不复制）
        │
src/tool-core/            ← 机器可调用的 Tool Core（Phase 13A 新增）
        │
        ▼（Phase 13B 已实现，见 docs/mcp-server.md）
MCP Server → stdio → MCP Client
```

关键原则：

- **不复制算法**：`src/tool-core/definitions.ts` 只 import `src/tools/*/logic.ts` 的既有纯函数，
  用固定、窄化的参数包裹它们；浏览器 UI 与机器运行时指向同一实现。
- **不暴露 UI 组件**：MCP 边界只看到 typed/bounded tool，永远看不到 Preact/Astro/Canvas。
- **工具站行为零回归**：`src/tools/*` 的 UI 代码和现有测试保持不变。

## 2. 入选的机器安全工具（10 个）

第一版只选择 `side_effect = none`、`network_access = false`、`deterministic = true`、
纯同步、无 DOM、无 crypto 随机、无网络、无文件、无浏览器存储的 atomic tool。

| tool id             | 输入                      | 输出                                                | 复用                          |
| ------------------- | ------------------------- | --------------------------------------------------- | ----------------------------- |
| `json_format`       | `{ text, indent?: 2\|4 }` | 格式化字符串                                        | `json/processJson`            |
| `json_minify`       | `{ text }`                | 单行字符串                                          | `json/processJson`            |
| `json_validate`     | `{ text }`                | `{ valid, error?, metadata? }`                      | `json/processJson`            |
| `base64_encode`     | `{ text }`                | Base64 字符串                                       | `base64/encodeTextToBase64`   |
| `base64_decode`     | `{ text }`                | UTF-8 文本                                          | `base64/decodeBase64ToText`   |
| `url_encode`        | `{ text }`                | 百分号编码（component）                             | `url/encodeUrlText`           |
| `url_decode`        | `{ text }`                | 解码文本（component）                               | `url/decodeUrlText`           |
| `text_count`        | `{ text }`                | Unicode 统计对象                                    | `text-counter/countText`      |
| `text_deduplicate`  | `{ text }`                | `{ output, stats }`                                 | `line-processor/processLines` |
| `timestamp_convert` | `{ timestamp }`           | `{ milliseconds, seconds, detectedUnit, iso, utc }` | `timestamp/timestampToDate`   |

### 确定性边界（刻意裁剪）

- JSON 不开启 `sortKeys`（避免 `localeCompare` 的 locale 依赖），键序原样保留。
- `text_deduplicate` 固定 `caseSensitive=true`、`normalizeForDedupe=true`（NFKC）、`order=keep`，
  不使用 `Intl.Collator` 排序，不使用随机顺序。
- `timestamp_convert` 固定 `timeZone=UTC`，并裁剪 `local` / `relative` 这类依赖机器时区与
  “当前时间”的字段，只保留 `iso` / `utc` / `seconds` / `milliseconds`。
- `base64` / `url` 只做 UTF-8 文本编解码；二进制文件字节不在 v1 范围。

## 3. 暂不入选（DEFER）与不入选（REJECT）

| 类别        | tool                                   | 原因                                               |
| ----------- | -------------------------------------- | -------------------------------------------------- |
| DEFER       | `sha256_text`                          | 依赖 `crypto.subtle`（async），首版保持全同步      |
| DEFER       | `uuid_v4`                              | 非确定（`deterministic=false`），会复杂化统一契约  |
| DEFER       | `jwt_decode`                           | `exp` 相对当前时间，语义需额外说明与警告           |
| DEFER       | `text_sort`                            | `Intl.Collator` 排序 locale 相关，确定性需额外冻结 |
| DEFER       | `token_estimate`                       | 纯启发式，需明确 estimate 语义                     |
| DEFER       | `doi_*`                                | 依赖手工 metadata，第一版聚焦 text/encoding/time   |
| REJECT(13A) | `regex_*`                              | JS RegExp 无可靠超时，存在 ReDoS 风险              |
| REJECT      | image / QR / chart / markdown / design | Canvas / DOM / UI 渲染，非 deterministic pure tool |

## 4. Tool Contract

见 `src/tool-core/contracts.ts`。一个 `ToolDefinition` 至少表达：

```text
id, name, description
inputSchema (JSON Schema), outputSchema (JSON Schema)
sideEffect, networkAccess, deterministic
timeoutMs, maxInputBytes, maxOutputBytes
execute(input) -> output | Promise<output>
```

- 输入必须 `additionalProperties: false`，required / enum / 长度边界显式。
- `execute` 接受 `unknown`，内部做窄化校验；跨语言契约以 JSON Schema 为唯一真相。
- 第一版所有工具统一 `sideEffect='none'`、`networkAccess=false`、`deterministic=true`。

## 5. Tool Registry

见 `src/tool-core/registry.ts`。显式 allowlist：`createToolRegistry()` 只注册上面 10 个定义，
没有文件系统扫描、没有动态 import。

```text
register（重复 id → DuplicateToolError）
get / has / list（未知 id → ToolNotFoundError；list 只读快照）
execute（size 检查 → 执行 → 错误归一化 → 输出 size 检查，永不抛异常）
```

## 6. Error Model

`execute` 永不向调用方抛异常，统一返回 `ToolResult`：

```text
INVALID_INPUT / INPUT_TOO_LARGE / OUTPUT_TOO_LARGE / UNSUPPORTED_OPTION /
EXECUTION_TIMEOUT / TOOL_NOT_FOUND / TOOL_DISABLED / INTERNAL_TOOL_ERROR
```

错误只携带稳定 code + 安全 message + 可选安全 details，**不含** stack trace、绝对路径或原始异常。

## 7. Resource Limits

默认（`src/tool-core/limits.ts`）：

```text
maxInputBytes  = 256 KiB
maxOutputBytes = 256 KiB
timeoutMs      = 2000（reserved；13B 在 server 进程边界执行）
```

`timeoutMs` 是预留元数据：Phase 13A 的工具都是有界同步纯函数，真正的超时抢占由 Phase 13B
的 MCP server 进程级完成。

## 8. Tool Result ≠ Evidence

`ToolResult` 是确定性计算结果，**不是** `zglab-rag` 中的 `Evidence`。两者在 Phase 14 之前保持
严格分离：确定性结果不需要伪造 citation；未来统一抽象是 Phase 14 的 `AgentObservation`。

## 9. Cross-repo Boundary（冻结为 Option B，13B 已落地 server）

```text
zglab-tools shared core
        ↓（Phase 13B）
MCP Server（stdio）
        ↓（Phase 13C）
zglab-rag MCP Client
```

- 不复制算法到 Python；Python 不 import Node package。
- MCP 承担 process boundary；语言边界清晰；`tools.zglab.fun` 浏览器 UI 与 MCP Server 共用
  同一 TypeScript core。
- MCP Server 不做公网端点，第一版 transport 冻结为 `stdio`。

完整跨仓库设计见 `zglab-rag` 仓库的 `docs/mcp-tool-runtime.md`。
