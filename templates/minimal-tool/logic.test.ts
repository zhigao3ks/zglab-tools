import { describe, expect, it } from 'vitest';
import { normalizeText } from './logic';

describe('normalizeText', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeText('  ZGLab   Tools  ', { trim: true, collapseSpaces: true })).toBe(
      'ZGLab Tools',
    );
  });

  it('keeps whitespace when both options are disabled', () => {
    expect(normalizeText(' A  B ', { trim: false, collapseSpaces: false })).toBe(' A  B ');
  });
});
