// Phase 13A — machine-facing Tool Core contracts.
//
// This module freezes the language-level contract that both the browser UI and
// a future MCP server (Phase 13B) share. It is deliberately minimal: a tool is
// a stable id + narrow input/output JSON Schema + a bounded execute function.
// It is NOT an agent runtime (no planner, no routing, no LLM selection).

export type SideEffect = 'none' | 'read_only' | 'write';

export type ToolErrorCode =
  | 'INVALID_INPUT'
  | 'INPUT_TOO_LARGE'
  | 'OUTPUT_TOO_LARGE'
  | 'UNSUPPORTED_OPTION'
  | 'EXECUTION_TIMEOUT'
  | 'TOOL_NOT_FOUND'
  | 'TOOL_DISABLED'
  | 'INTERNAL_TOOL_ERROR';

export type JsonSchemaPrimitive =
  'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'null';

/**
 * A minimal JSON Schema (draft 2020-12 subset) used to describe tool input and
 * output for MCP `tools/list` / `tools/call`. Only the fields this runtime
 * actually validates or advertises are represented.
 */
export interface JsonSchema {
  type?: JsonSchemaPrimitive | JsonSchemaPrimitive[];
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  enum?: unknown[];
  items?: JsonSchema;
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

/**
 * A machine-facing tool definition. `inputSchema` / `outputSchema` are the
 * source of truth for the cross-language contract (MCP uses JSON Schema, not
 * TypeScript). `execute` accepts `unknown` and narrows internally.
 */
export interface ToolDefinition {
  /** Stable snake_case id; the machine + evaluation + audit contract. */
  id: string;
  /** Short, stable English display name (never the Chinese UI title). */
  name: string;
  /** Machine-facing description: determinism, side effects and bounds. */
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  /** Phase 13A freezes this to 'none' for every tool. */
  sideEffect: SideEffect;
  /** Phase 13A freezes this to false for every tool. */
  networkAccess: boolean;
  /** Whether the same input always yields the same output. */
  deterministic: boolean;
  /** Reserved; Phase 13B enforces this at the MCP server process boundary. */
  timeoutMs: number;
  maxInputBytes: number;
  maxOutputBytes: number;
  execute(input: unknown): unknown | Promise<unknown>;
}

export interface ToolErrorPayload {
  code: ToolErrorCode;
  message: string;
  details?: Record<string, string | number | boolean | null>;
}

export interface ToolResultMetadata {
  toolId: string;
  inputBytes: number;
  outputBytes: number;
}

export type ToolResult<Output = unknown> =
  | { status: 'success'; output: Output; metadata: ToolResultMetadata }
  | { status: 'error'; error: ToolErrorPayload };
