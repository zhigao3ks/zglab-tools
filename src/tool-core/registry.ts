import type { ToolDefinition, ToolResult, ToolResultMetadata } from './contracts';
import { DuplicateToolError, ToolError, ToolNotFoundError } from './errors';

const byteLength = (value: unknown): number => {
  let serialized: string;
  try {
    serialized = JSON.stringify(value) ?? '';
  } catch {
    serialized = '';
  }
  return new TextEncoder().encode(serialized).byteLength;
};

/**
 * An explicit, deterministic registry.
 *
 * There is no filesystem scan and no dynamic import: the production allowlist
 * is exactly the set of definitions a caller passes to `register` (see
 * `createToolRegistry`). `get`/`list` never execute anything.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) throw new DuplicateToolError(tool.id);
    this.tools.set(tool.id, tool);
  }

  has(id: string): boolean {
    return this.tools.has(id);
  }

  get(id: string): ToolDefinition {
    const tool = this.tools.get(id);
    if (!tool) throw new ToolNotFoundError(id);
    return tool;
  }

  list(): ToolDefinition[] {
    return [...this.tools.values()];
  }

  /**
   * Run a tool through the uniform bounded pipeline: size check, execution,
   * error normalization and output-size check. Never throws: every outcome is
   * a `ToolResult`, and internal errors are reduced to a safe code.
   */
  async execute(id: string, input: unknown): Promise<ToolResult> {
    const tool = this.tools.get(id);
    if (!tool) {
      return {
        status: 'error',
        error: { code: 'TOOL_NOT_FOUND', message: `Tool '${id}' is not registered` },
      };
    }

    const inputBytes = byteLength(input);
    if (inputBytes > tool.maxInputBytes) {
      return {
        status: 'error',
        error: {
          code: 'INPUT_TOO_LARGE',
          message: `input exceeds the ${tool.maxInputBytes}-byte limit`,
          details: { maxBytes: tool.maxInputBytes, actualBytes: inputBytes },
        },
      };
    }

    try {
      const output = await tool.execute(input);
      const outputBytes = byteLength(output);
      if (outputBytes > tool.maxOutputBytes) {
        return {
          status: 'error',
          error: {
            code: 'OUTPUT_TOO_LARGE',
            message: `output exceeds the ${tool.maxOutputBytes}-byte limit`,
            details: { maxBytes: tool.maxOutputBytes, actualBytes: outputBytes },
          },
        };
      }
      const metadata: ToolResultMetadata = { toolId: id, inputBytes, outputBytes };
      return { status: 'success', output, metadata };
    } catch (error) {
      if (error instanceof ToolError) {
        return {
          status: 'error',
          error: { code: error.code, message: error.message, details: error.details },
        };
      }
      return {
        status: 'error',
        error: { code: 'INTERNAL_TOOL_ERROR', message: 'tool execution failed' },
      };
    }
  }
}
