import { describe, expect, it } from 'vitest';
import { createToolRegistry, TOOL_DEFINITIONS } from './definitions';
import { ToolRegistry } from './registry';

const registry: ToolRegistry = createToolRegistry();

const success = async (id: string, input: unknown): Promise<unknown> => {
  const result = await registry.execute(id, input);
  expect(result.status).toBe('success');
  if (result.status !== 'success') throw new Error('unreachable');
  return result.output;
};

const failure = async (id: string, input: unknown): Promise<string> => {
  const result = await registry.execute(id, input);
  expect(result.status).toBe('error');
  if (result.status !== 'error') throw new Error('unreachable');
  return result.error.code;
};

describe('Phase 13A tool contract invariants', () => {
  it('uses unique snake_case ids', () => {
    const ids = TOOL_DEFINITIONS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it('freezes the SAFE / READ-ONLY / NO-NETWORK / DETERMINISTIC boundary', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.sideEffect, tool.id).toBe('none');
      expect(tool.networkAccess, tool.id).toBe(false);
      expect(tool.deterministic, tool.id).toBe(true);
    }
  });

  it('declares bounded resources and rejects extra input fields', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.maxInputBytes, tool.id).toBeGreaterThan(0);
      expect(tool.maxOutputBytes, tool.id).toBeGreaterThan(0);
      expect(tool.timeoutMs, tool.id).toBeGreaterThan(0);
      expect(tool.inputSchema.additionalProperties, tool.id).toBe(false);
      expect(tool.name.length, tool.id).toBeGreaterThan(0);
      expect(tool.description.length, tool.id).toBeGreaterThan(0);
    }
  });
});

describe('json_format', () => {
  it('formats valid JSON with 2 spaces by default', async () => {
    const output = await success('json_format', { text: '{"b":1,"a":[1,2]}' });
    expect(output).toBe('{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}');
  });

  it('honours the indent option and rejects invalid indent', async () => {
    const output = await success('json_format', { text: '{"a":1}', indent: 4 });
    expect(output).toBe('{\n    "a": 1\n}');
    expect(await failure('json_format', { text: '{"a":1}', indent: 3 })).toBe('UNSUPPORTED_OPTION');
  });

  it('preserves key order and is deterministic', async () => {
    const first = await success('json_format', { text: '{"z":1,"a":2,"m":3}' });
    const second = await success('json_format', { text: '{"z":1,"a":2,"m":3}' });
    expect(first).toBe(second);
    expect(first).toBe('{\n  "z": 1,\n  "a": 2,\n  "m": 3\n}');
  });

  it('rejects malformed JSON with INVALID_INPUT', async () => {
    expect(await failure('json_format', { text: '{"a":}' })).toBe('INVALID_INPUT');
  });

  it('rejects extra fields and non-object input', async () => {
    expect(await failure('json_format', { text: '{}', extra: true })).toBe('INVALID_INPUT');
    expect(await failure('json_format', '{}')).toBe('INVALID_INPUT');
  });
});

describe('json_minify', () => {
  it('minifies valid JSON', async () => {
    expect(await success('json_minify', { text: '{ "a" : 1 }' })).toBe('{"a":1}');
  });

  it('rejects malformed JSON', async () => {
    expect(await failure('json_minify', { text: '[1,2' })).toBe('INVALID_INPUT');
  });
});

describe('json_validate', () => {
  it('returns valid:true with metadata for valid JSON', async () => {
    const output = (await success('json_validate', { text: '{"a":1,"b":2}' })) as {
      valid: boolean;
      error: unknown;
      metadata: { type: string; topLevelSize: number | null };
    };
    expect(output.valid).toBe(true);
    expect(output.error).toBeNull();
    expect(output.metadata.type).toBe('object');
    expect(output.metadata.topLevelSize).toBe(2);
  });

  it('returns valid:false with a safe structured error for malformed JSON', async () => {
    const output = (await success('json_validate', { text: '{\n  "a":\n}' })) as {
      valid: boolean;
      error: { message: string; line: number | null; column: number | null };
    };
    expect(output.valid).toBe(false);
    expect(output.error.message.length).toBeGreaterThan(0);
    // line/column are populated when the runtime parser reports them and null
    // otherwise; the contract guarantees "number or null", never undefined.
    expect(output.error.line === null || typeof output.error.line === 'number').toBe(true);
    expect(output.error.column === null || typeof output.error.column === 'number').toBe(true);
  });
});

describe('base64_encode / base64_decode', () => {
  it('round-trips ASCII and Unicode (Chinese + emoji)', async () => {
    const text = 'hello 世界 🌍';
    const encoded = (await success('base64_encode', { text })) as string;
    expect(encoded).toBe('aGVsbG8g5LiW55WMIPCfjI0=');
    expect(await success('base64_decode', { text: encoded })).toBe(text);
  });

  it('rejects empty and malformed input deterministically', async () => {
    expect(await failure('base64_encode', { text: '' })).toBe('INVALID_INPUT');
    expect(await failure('base64_decode', { text: 'not-base64!!' })).toBe('INVALID_INPUT');
  });
});

describe('url_encode / url_decode', () => {
  it('round-trips reserved and Unicode text', async () => {
    const text = 'a=b&c 中文';
    const encoded = (await success('url_encode', { text })) as string;
    expect(encoded).toBe('a%3Db%26c%20%E4%B8%AD%E6%96%87');
    expect(await success('url_decode', { text: encoded })).toBe(text);
  });

  it('rejects malformed percent-encoding and empty input', async () => {
    expect(await failure('url_decode', { text: '%E4%ZZ' })).toBe('INVALID_INPUT');
    expect(await failure('url_encode', { text: '' })).toBe('INVALID_INPUT');
  });
});

describe('text_count', () => {
  it('counts Unicode-aware statistics', async () => {
    const output = (await success('text_count', { text: '中文abc\n第二行' })) as {
      characterCount: number;
      chineseCharacterCount: number;
      lineCount: number;
      utf8Bytes: number;
    };
    expect(output.characterCount).toBe(9);
    expect(output.chineseCharacterCount).toBe(5);
    expect(output.lineCount).toBe(2);
    expect(output.utf8Bytes).toBeGreaterThan(output.characterCount);
  });

  it('returns zeros for empty input', async () => {
    const output = (await success('text_count', { text: '' })) as {
      characterCount: number;
      lineCount: number;
    };
    expect(output.characterCount).toBe(0);
    expect(output.lineCount).toBe(0);
  });
});

describe('text_deduplicate', () => {
  it('trims, removes empty lines and keeps first occurrences in order', async () => {
    const output = (await success('text_deduplicate', {
      text: '  b  \na\n\nb\nc\na',
    })) as { output: string; stats: { duplicateLinesRemoved: number; emptyLinesRemoved: number } };
    expect(output.output).toBe('b\na\nc');
    expect(output.stats.duplicateLinesRemoved).toBe(2);
    expect(output.stats.emptyLinesRemoved).toBe(1);
  });

  it('is deterministic for repeated calls', async () => {
    const input = 'x\ny\nx\nz';
    const first = await success('text_deduplicate', { text: input });
    const second = await success('text_deduplicate', { text: input });
    expect(first).toEqual(second);
  });
});

describe('timestamp_convert', () => {
  it('auto-detects seconds', async () => {
    const output = (await success('timestamp_convert', { timestamp: '1700000000' })) as {
      detectedUnit: string;
      iso: string;
      seconds: number;
    };
    expect(output.detectedUnit).toBe('seconds');
    expect(output.iso).toBe('2023-11-14T22:13:20.000Z');
    expect(output.seconds).toBe(1700000000);
  });

  it('auto-detects milliseconds', async () => {
    const output = (await success('timestamp_convert', { timestamp: '1700000000000' })) as {
      detectedUnit: string;
      iso: string;
    };
    expect(output.detectedUnit).toBe('milliseconds');
    expect(output.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('rejects non-numeric and out-of-range input', async () => {
    expect(await failure('timestamp_convert', { timestamp: 'not-a-number' })).toBe('INVALID_INPUT');
    expect(await failure('timestamp_convert', { timestamp: '99999999999999999999' })).toBe(
      'INVALID_INPUT',
    );
  });
});
