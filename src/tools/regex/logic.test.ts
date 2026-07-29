import { describe, expect, it } from 'vitest';
import { findRegexMatches, replaceByRegex } from './logic';

describe('regex logic', () => {
  it('returns all matches and capturing groups even without g', () => {
    expect(findRegexMatches('(\\w+)-(\\d+)', 'i', 'item-2 and tool-7')).toEqual([
      { index: 0, value: 'item-2', groups: ['item', '2'], namedGroups: {} },
      { index: 11, value: 'tool-7', groups: ['tool', '7'], namedGroups: {} },
    ]);
  });

  it('supports global replacement with capture references', () => {
    expect(replaceByRegex('(\\w+)-(\\d+)', '', 'item-2 tool-7', '$2:$1')).toBe('2:item 7:tool');
  });

  it('rejects repeated flags', () => {
    expect(() => findRegexMatches('.', 'gg', 'a')).toThrow('标志');
  });
});
