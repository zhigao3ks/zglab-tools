import { describe, expect, it } from 'vitest';
import { calculateScreenRatio, hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from './logic';

describe('design logic', () => {
  it('converts HEX, RGB and HSL', () => {
    expect(hexToRgb('#3b82f6')).toEqual({ red: 59, green: 130, blue: 246 });
    expect(rgbToHex({ red: 59, green: 130, blue: 246 })).toBe('#3B82F6');
    expect(rgbToHsl({ red: 255, green: 0, blue: 0 })).toEqual({
      hue: 0,
      saturation: 100,
      lightness: 50,
    });
    expect(hslToRgb({ hue: 120, saturation: 100, lightness: 50 })).toEqual({
      red: 0,
      green: 255,
      blue: 0,
    });
  });

  it('calculates reduced screen ratios', () => {
    expect(calculateScreenRatio(1920, 1080)).toMatchObject({ ratio: '16:9', orientation: '横向' });
  });
});
