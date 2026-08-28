// Phase 13B — MCP adapter. This is the ONLY place where the machine Tool Core
// is translated to/from the MCP protocol. It imports nothing from UI code and
// never re-implements tool logic; the allowlist and execution stay in the
// ToolRegistry.
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolDefinition, ToolResult } from '../tool-core/contracts.js';

const serialize = (value: unknown): string => {
  try {
    return JSON.stringify(value) ?? 'null';
  } catch {
    return 'null';
  }
};

/**
 * Map a ToolDefinition to an MCP `tools/list` entry.
 *
 * `name` is the stable snake_case Tool ID; `title` is the short English
 * display name. `inputSchema` is the raw Phase 13A JSON Schema (single source
 * of truth — no Zod translation, no second schema). Annotations are metadata
 * hints only, never authorization: the allowlist remains the registry.
 */
export const toMcpTool = (definition: ToolDefinition): Tool => ({
  name: definition.id,
  title: definition.name,
  description: definition.description,
  inputSchema: definition.inputSchema as unknown as Tool['inputSchema'],
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: definition.deterministic,
    openWorldHint: false,
  },
});

/**
 * Map a `ToolResult` to an MCP `tools/call` result.
 *
 * Success carries the structured output in `structuredContent.result` plus a
 * JSON text block as a compatibility layer. Tool execution errors are returned
 * as `isError: true` results with a stable, safe code/message — never a thrown
 * protocol error, never a stack trace, never an absolute path. A malformed
 * JSON *document* is a successful `json_validate` result (`valid: false`), not
 * an error; an invalid *argument shape* is a tool error result.
 */
export const toCallToolResult = (result: ToolResult): CallToolResult => {
  if (result.status === 'success') {
    return {
      content: [{ type: 'text', text: serialize(result.output) }],
      structuredContent: { status: 'success', result: result.output },
    };
  }
  const { code, message, details } = result.error;
  return {
    content: [{ type: 'text', text: `${code}: ${message}` }],
    structuredContent:
      details === undefined
        ? { status: 'error', code, message }
        : { status: 'error', code, message, details },
    isError: true,
  };
};
