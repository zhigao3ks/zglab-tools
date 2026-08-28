import { describe, expect, it } from 'vitest';
import type { ToolDefinition } from './contracts';
import { createToolRegistry } from './definitions';
import { DuplicateToolError, ToolError, ToolNotFoundError } from './errors';
import { ToolRegistry } from './registry';

const synthetic = (overrides: Partial<ToolDefinition> = {}): ToolDefinition => ({
  id: 'test_tool',
  name: 'Test tool',
  description: 'synthetic tool for registry tests',
  inputSchema: { type: 'object', additionalProperties: false },
  outputSchema: { type: 'string' },
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: 1000,
  maxInputBytes: 1024,
  maxOutputBytes: 1024,
  execute: () => 'ok',
  ...overrides,
});

describe('ToolRegistry', () => {
  it('registers, gets and lists the explicit allowlist in insertion order', () => {
    const registry = createToolRegistry();
    const ids = registry.list().map((tool) => tool.id);
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
    expect(registry.has('json_format')).toBe(true);
    expect(registry.get('json_format').id).toBe('json_format');
  });

  it('rejects duplicate registration with a typed error', () => {
    const registry = new ToolRegistry();
    registry.register(synthetic());
    expect(() => registry.register(synthetic())).toThrow(DuplicateToolError);
  });

  it('rejects unknown ids with a typed error on get', () => {
    const registry = new ToolRegistry();
    expect(() => registry.get('missing')).toThrow(ToolNotFoundError);
  });

  it('returns a TOOL_NOT_FOUND result instead of throwing on execute', async () => {
    const registry = new ToolRegistry();
    const result = await registry.execute('missing', {});
    expect(result.status).toBe('error');
    if (result.status === 'error') expect(result.error.code).toBe('TOOL_NOT_FOUND');
  });

  it('executes a registered tool and returns a success result', async () => {
    const registry = createToolRegistry();
    const result = await registry.execute('json_validate', { text: '{"a":1}' });
    expect(result.status).toBe('success');
  });

  it('returns INPUT_TOO_LARGE when the input exceeds the tool limit', async () => {
    const registry = new ToolRegistry();
    registry.register(synthetic({ maxInputBytes: 8 }));
    const result = await registry.execute('test_tool', { text: 'x'.repeat(100) });
    expect(result.status).toBe('error');
    if (result.status === 'error') expect(result.error.code).toBe('INPUT_TOO_LARGE');
  });

  it('returns OUTPUT_TOO_LARGE when the output exceeds the tool limit', async () => {
    const registry = new ToolRegistry();
    registry.register(synthetic({ maxOutputBytes: 8, execute: () => 'x'.repeat(100) }));
    const result = await registry.execute('test_tool', {});
    expect(result.status).toBe('error');
    if (result.status === 'error') expect(result.error.code).toBe('OUTPUT_TOO_LARGE');
  });

  it('propagates a ToolError as a typed error result', async () => {
    const registry = new ToolRegistry();
    registry.register(
      synthetic({
        execute: () => {
          throw new ToolError('UNSUPPORTED_OPTION', 'bad option', { field: 'mode' });
        },
      }),
    );
    const result = await registry.execute('test_tool', {});
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('UNSUPPORTED_OPTION');
      expect(result.error.message).toBe('bad option');
    }
  });

  it('reduces unexpected exceptions to a safe INTERNAL_TOOL_ERROR with no leak', async () => {
    const registry = new ToolRegistry();
    registry.register(
      synthetic({
        execute: () => {
          throw new Error('secret internal detail /absolute/path');
        },
      }),
    );
    const result = await registry.execute('test_tool', {});
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('INTERNAL_TOOL_ERROR');
      expect(result.error.message).toBe('tool execution failed');
      expect(result.error.message).not.toContain('secret');
    }
  });
});
