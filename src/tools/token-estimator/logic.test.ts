import { describe, expect, it } from 'vitest';
import { estimateTokens } from './logic';

describe('token estimator logic', () => {
  it('reports text composition and non-zero heuristic estimates', () => {
    const result = estimateTokens('中文 text 123');
    expect(result.hanCharacters).toBe(2);
    expect(result.latinCharacters).toBe(4);
    expect(result.estimates.balanced).toBeGreaterThan(0);
  });

  it('returns zero estimates for empty input', () => {
    expect(estimateTokens('').estimates).toEqual({
      balanced: 0,
      chineseHeavy: 0,
      englishOrCode: 0,
    });
  });
});
