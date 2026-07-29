import { describe, expect, it } from 'vitest';
import { compareText } from './logic';

describe('text diff logic', () => {
  it('marks inserted and deleted content on their respective sides', () => {
    const result = compareText('你好，世界', '你好，ZGLab');
    expect(result.left).toEqual([
      { kind: 'same', value: '你好，' },
      { kind: 'removed', value: '世界' },
    ]);
    expect(result.right).toEqual([
      { kind: 'same', value: '你好，' },
      { kind: 'added', value: 'ZGLab' },
    ]);
  });

  it('does not mark identical text', () => {
    const result = compareText('same', 'same');
    expect(result.addedCharacters).toBe(0);
    expect(result.removedCharacters).toBe(0);
    expect(result.left).toEqual([{ kind: 'same', value: 'same' }]);
  });
});
