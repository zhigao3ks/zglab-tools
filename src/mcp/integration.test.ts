// Phase 13B Definition of Done: a REAL official MCP Client spawns the stdio
// server and completes initialize → tools/list → tools/call over the wire.
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const CLI_PATH = fileURLToPath(new URL('./cli.ts', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

interface CallResult {
  content: Array<{ type: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

interface ListedTool {
  name: string;
  inputSchema: Record<string, unknown>;
}

let client: Client;
let transport: StdioClientTransport;

const call = async (name: string, args: Record<string, unknown>): Promise<CallResult> => {
  const result = await client.callTool({ name, arguments: args });
  return result as unknown as CallResult;
};

beforeAll(async () => {
  transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--import', 'tsx', CLI_PATH],
    cwd: REPO_ROOT,
    stderr: 'pipe',
  });
  client = new Client({ name: 'zglab-tools-test', version: '1.0.0' });
  await client.connect(transport);
}, 30_000);

afterAll(async () => {
  await client.close();
});

describe('tools/list over stdio', () => {
  it('discovers exactly the 10 allowlisted tools, no extras', async () => {
    const { tools } = (await client.listTools()) as unknown as { tools: ListedTool[] };
    const ids = tools.map((tool) => tool.name).sort();
    expect(ids).toEqual(
      [
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
      ].sort(),
    );
  });

  it('does not expose any unapproved tool', async () => {
    const { tools } = (await client.listTools()) as unknown as { tools: ListedTool[] };
    const ids = tools.map((tool) => tool.name);
    for (const banned of ['regex', 'jwt', 'hash', 'uuid', 'image', 'shell', 'filesystem']) {
      expect(ids.some((id) => id.includes(banned))).toBe(false);
    }
  });

  it('advertises an input schema for every tool', async () => {
    const { tools } = (await client.listTools()) as unknown as { tools: ListedTool[] };
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe('object');
    }
  });
});

describe('tools/call over stdio', () => {
  it('json_format returns the formatted string', async () => {
    const result = await call('json_format', { text: '{"b":1,"a":2}' });
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({
      status: 'success',
      result: '{\n  "b": 1,\n  "a": 2\n}',
    });
  });

  it('json_validate returns valid:false (a success result, not an error)', async () => {
    const result = await call('json_validate', { text: '{"a":}' });
    expect(result.isError).toBeUndefined();
    const sc = result.structuredContent as { status: string; result: { valid: boolean } };
    expect(sc.status).toBe('success');
    expect(sc.result.valid).toBe(false);
  });

  it('base64 round-trips UTF-8', async () => {
    const encoded = await call('base64_encode', { text: 'hello 世界 🌍' });
    const sc = encoded.structuredContent as { result: string };
    const decoded = await call('base64_decode', { text: sc.result });
    const dc = decoded.structuredContent as { result: string };
    expect(dc.result).toBe('hello 世界 🌍');
  });

  it('url round-trips Unicode', async () => {
    const encoded = await call('url_encode', { text: 'a=b&c 中文' });
    const sc = encoded.structuredContent as { result: string };
    const decoded = await call('url_decode', { text: sc.result });
    const dc = decoded.structuredContent as { result: string };
    expect(dc.result).toBe('a=b&c 中文');
  });

  it('text_count counts Chinese/English/emoji', async () => {
    const result = await call('text_count', { text: '中文abc' });
    const sc = result.structuredContent as {
      result: { characterCount: number; chineseCharacterCount: number; lineCount: number };
    };
    expect(sc.result.characterCount).toBe(5);
    expect(sc.result.chineseCharacterCount).toBe(2);
    expect(sc.result.lineCount).toBe(1);
  });

  it('text_deduplicate keeps first occurrences in order', async () => {
    const result = await call('text_deduplicate', { text: '  b  \na\n\nb\nc\na' });
    const sc = result.structuredContent as { result: { output: string } };
    expect(sc.result.output).toBe('b\na\nc');
  });

  it('timestamp_convert detects seconds', async () => {
    const result = await call('timestamp_convert', { timestamp: '1700000000' });
    const sc = result.structuredContent as {
      result: { detectedUnit: string; iso: string };
    };
    expect(sc.result.detectedUnit).toBe('seconds');
    expect(sc.result.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('timestamp_convert detects milliseconds', async () => {
    const result = await call('timestamp_convert', { timestamp: '1700000000000' });
    const sc = result.structuredContent as { result: { detectedUnit: string } };
    expect(sc.result.detectedUnit).toBe('milliseconds');
  });
});

describe('adversarial calls', () => {
  it('rejects an unknown tool safely (no crash, no guess)', async () => {
    const result = await call('shell_exec', { cmd: 'id' });
    expect(result.isError).toBe(true);
    const sc = result.structuredContent as { code: string; status: string };
    expect(sc.status).toBe('error');
    expect(sc.code).toBe('TOOL_NOT_FOUND');
  });

  it('rejects an extra input field', async () => {
    const result = await call('json_format', { text: '{}', extra: true });
    expect(result.isError).toBe(true);
    expect((result.structuredContent as { code: string }).code).toBe('INVALID_INPUT');
  });

  it('rejects a wrong argument type', async () => {
    const result = await call('json_format', { text: 123 });
    expect(result.isError).toBe(true);
    expect((result.structuredContent as { code: string }).code).toBe('INVALID_INPUT');
  });

  it('rejects a missing required field', async () => {
    const result = await call('json_format', {});
    expect(result.isError).toBe(true);
    expect((result.structuredContent as { code: string }).code).toBe('INVALID_INPUT');
  });

  it('rejects an oversized input with INPUT_TOO_LARGE', async () => {
    const result = await call('text_count', { text: 'x'.repeat(300 * 1024) });
    expect(result.isError).toBe(true);
    expect((result.structuredContent as { code: string }).code).toBe('INPUT_TOO_LARGE');
  });

  it('rejects an overflowing output with OUTPUT_TOO_LARGE', async () => {
    const result = await call('base64_encode', { text: 'x'.repeat(200_000) });
    expect(result.isError).toBe(true);
    expect((result.structuredContent as { code: string }).code).toBe('OUTPUT_TOO_LARGE');
  });

  it('handles multiple sequential calls', async () => {
    for (let index = 0; index < 5; index += 1) {
      const result = await call('json_minify', { text: `{"i":${index}}` });
      expect(result.isError).toBeUndefined();
    }
  });

  it('handles concurrent calls', async () => {
    const results = await Promise.all([
      call('url_encode', { text: 'a b' }),
      call('base64_encode', { text: 'ab' }),
      call('timestamp_convert', { timestamp: '0' }),
    ]);
    for (const result of results) expect(result.isError).toBeUndefined();
  });
});
