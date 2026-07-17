import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LINE_OPTIONS,
  fisherYatesShuffle,
  normalizeLineBreaks,
  processLines,
} from './logic';

describe('processLines', () => {
  it('keeps the first duplicate by default', () => {
    const result = processLines('alpha\nbeta\nalpha');
    expect(result.output).toBe('alpha\nbeta');
    expect(result.stats.duplicateLinesRemoved).toBe(1);
  });

  it('keeps the last duplicate while preserving last occurrence order', () => {
    const result = processLines('a\nb\na\nc', {
      ...DEFAULT_LINE_OPTIONS,
      dedupeMode: 'last',
    });
    expect(result.output).toBe('b\na\nc');
  });

  it('deduplicates case-insensitively', () => {
    const result = processLines('ZGLab\nzglab\nTools', {
      ...DEFAULT_LINE_OPTIONS,
      caseSensitive: false,
    });
    expect(result.output).toBe('ZGLab\nTools');
  });

  it('deduplicates after trimming while preserving the first text', () => {
    const result = processLines(' value \nvalue\n other ');
    expect(result.output).toBe('value\nother');
  });

  it('normalizes CRLF and removes empty lines', () => {
    const result = processLines('a\r\n\r\nb');
    expect(normalizeLineBreaks('a\r\nb\rc')).toBe('a\nb\nc');
    expect(result.output).toBe('a\nb');
    expect(result.stats.emptyLinesRemoved).toBe(1);
  });

  it('merges consecutive empty lines', () => {
    const result = processLines('a\n\n\nb\n\nc', {
      ...DEFAULT_LINE_OPTIONS,
      emptyLineMode: 'merge',
      dedupeMode: 'none',
    });
    expect(result.output).toBe('a\n\nb\n\nc');
  });

  it('uses natural sorting', () => {
    const result = processLines('item10\nitem2\nitem1', {
      ...DEFAULT_LINE_OPTIONS,
      dedupeMode: 'none',
      order: 'natural',
    });
    expect(result.lines).toEqual(['item1', 'item2', 'item10']);
  });

  it('uses numeric sorting without dropping mixed text', () => {
    const result = processLines('10\n2\napple\n-1\nitem2', {
      ...DEFAULT_LINE_OPTIONS,
      dedupeMode: 'none',
      order: 'numeric',
    });
    expect(result.lines.slice(0, 3)).toEqual(['-1', '2', '10']);
    expect(result.lines).toContain('apple');
    expect(result.lines).toContain('item2');
  });

  it('sorts Chinese text with Intl.Collator', () => {
    const result = processLines('张三\n李四\n王五', {
      ...DEFAULT_LINE_OPTIONS,
      dedupeMode: 'none',
      order: 'asc',
    });
    expect(result.lines).toHaveLength(3);
    expect(new Set(result.lines)).toEqual(new Set(['张三', '李四', '王五']));
  });

  it('reverses line order', () => {
    const result = processLines('a\nb\nc', {
      ...DEFAULT_LINE_OPTIONS,
      dedupeMode: 'none',
      order: 'reverse',
    });
    expect(result.output).toBe('c\nb\na');
  });
});

describe('fisherYatesShuffle', () => {
  it('does not lose or add elements', () => {
    const values = ['a', 'b', 'c', 'd'];
    const randomValues = [0.1, 0.7, 0.3];
    let index = 0;
    const output = fisherYatesShuffle(values, () => randomValues[index++] ?? 0);
    expect(output).toHaveLength(values.length);
    expect(new Set(output)).toEqual(new Set(values));
    expect(values).toEqual(['a', 'b', 'c', 'd']);
  });
});
