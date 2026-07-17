import { describe, expect, it } from 'vitest';
import { createJsonParseIssue, getJsonDownloadContent, processJson, sortJsonKeys } from './logic';

const formatOptions = { mode: 'format', indent: 2, sortKeys: false } as const;

describe('processJson', () => {
  it('formats a valid object', () => {
    const result = processJson('{"name":"ZGLab","active":true}', formatOptions);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain('\n  "name"');
      expect(result.metadata.type).toBe('object');
      expect(result.metadata.topLevelSize).toBe(2);
    }
  });

  it('keeps array order', () => {
    const result = processJson('[3,1,2]', { ...formatOptions, sortKeys: true });
    expect(result.ok && result.output).toBe('[\n  3,\n  1,\n  2\n]');
  });

  it('handles nested objects and recursively sorts keys', () => {
    const result = processJson('{"z":{"b":1,"a":2},"a":0}', {
      ...formatOptions,
      sortKeys: true,
    });
    expect(result.ok && result.output.indexOf('"a"')).toBeLessThan(
      result.ok ? result.output.indexOf('"z"') : 0,
    );
    expect(result.ok && result.output).toContain('"z": {\n    "a": 2,\n    "b": 1');
  });

  it.each([
    ['null', 'null'],
    ['{}', 'object'],
    ['[]', 'array'],
    ['"中文😀"', 'string'],
    ['42', 'number'],
    ['false', 'boolean'],
  ])('detects %s as %s', (input, type) => {
    const result = processJson(input, formatOptions);
    expect(result.ok && result.metadata.type).toBe(type);
  });

  it('minifies JSON', () => {
    const result = processJson('{ "a": 1, "b": [2, 3] }', {
      mode: 'minify',
      indent: 4,
      sortKeys: false,
    });
    expect(result.ok && result.output).toBe('{"a":1,"b":[2,3]}');
  });

  it('reports an illegal trailing comma without clearing source context', () => {
    const input = '{"a": 1,}';
    const result = processJson(input, formatOptions);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue.message.length).toBeGreaterThan(0);
      expect(result.issue.context).toContain('{"a": 1,}');
    }
  });

  it('reports missing quotes', () => {
    const result = processJson('{name: "ZGLab"}', formatOptions);
    expect(result.ok).toBe(false);
  });

  it('creates line and column details from an error position', () => {
    const issue = createJsonParseIssue(
      '{\n  "a": 1,\n}',
      new SyntaxError('Unexpected token at position 12'),
    );
    expect(issue.line).toBe(3);
    expect(issue.column).toBe(1);
  });

  it('adds a final newline to downloaded JSON', () => {
    expect(getJsonDownloadContent('{"a":1}')).toBe('{"a":1}\n');
    expect(getJsonDownloadContent('{"a":1}\n')).toBe('{"a":1}\n');
  });
});

describe('sortJsonKeys', () => {
  it('defends against circular references', () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    expect(() => sortJsonKeys(value as never)).toThrow('循环引用');
  });
});
