import { describe, expect, it } from 'vitest';
import { createToolRegistry } from '../tool-core/index.js';
import { toCallToolResult, toMcpTool } from './adapter.js';

describe('toMcpTool', () => {
  it('maps id/name/description/inputSchema and safe annotations', () => {
    const registry = createToolRegistry();
    const tool = toMcpTool(registry.get('json_format'));

    expect(tool.name).toBe('json_format');
    expect(tool.title).toBe('Format JSON');
    expect(tool.description?.length ?? 0).toBeGreaterThan(0);
    expect(tool.inputSchema.type).toBe('object');
    expect(tool.inputSchema.required).toContain('text');
    expect(tool.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
  });

  it('exposes exactly the 10 allowlisted tools with stable ids and object schemas', () => {
    const registry = createToolRegistry();
    const tools = registry.list().map(toMcpTool);
    const ids = tools.map((tool) => tool.name);
    expect(ids).toEqual([
      'json_format',
      'json_minify',
      'json_validate',
      'base64_encode',
      'base64_decode',
      'url_encode',
      'url_decode',
      'text_count',
      'text_deduplicate',
      'timestamp_convert',
    ]);
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.destructiveHint).toBe(false);
    }
  });
});

describe('toCallToolResult', () => {
  it('maps success to structuredContent.result plus a JSON text block', () => {
    const result = toCallToolResult({
      status: 'success',
      output: { characterCount: 3 },
      metadata: { toolId: 'text_count', inputBytes: 20, outputBytes: 30 },
    });
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ status: 'success', result: { characterCount: 3 } });
    expect(result.content).toEqual([{ type: 'text', text: '{"characterCount":3}' }]);
  });

  it('maps a string output into structuredContent.result (still structured)', () => {
    const result = toCallToolResult({
      status: 'success',
      output: 'aGVsbG8=',
      metadata: { toolId: 'base64_encode', inputBytes: 5, outputBytes: 8 },
    });
    expect(result.structuredContent).toEqual({ status: 'success', result: 'aGVsbG8=' });
    expect(result.content).toEqual([{ type: 'text', text: '"aGVsbG8="' }]);
  });

  it('maps a tool error to isError:true with safe code/message (no details)', () => {
    const result = toCallToolResult({
      status: 'error',
      error: { code: 'TOOL_NOT_FOUND', message: "Tool 'shell_exec' is not registered" },
    });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({
      status: 'error',
      code: 'TOOL_NOT_FOUND',
      message: "Tool 'shell_exec' is not registered",
    });
    expect(result.content).toEqual([
      { type: 'text', text: "TOOL_NOT_FOUND: Tool 'shell_exec' is not registered" },
    ]);
  });

  it('carries safe details when present', () => {
    const result = toCallToolResult({
      status: 'error',
      error: {
        code: 'INPUT_TOO_LARGE',
        message: 'input exceeds the 262144-byte limit',
        details: { maxBytes: 262144, actualBytes: 300000 },
      },
    });
    expect(result.structuredContent).toEqual({
      status: 'error',
      code: 'INPUT_TOO_LARGE',
      message: 'input exceeds the 262144-byte limit',
      details: { maxBytes: 262144, actualBytes: 300000 },
    });
  });
});
