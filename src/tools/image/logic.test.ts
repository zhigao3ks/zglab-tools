import { describe, expect, it } from 'vitest';
import { buildIcoBytes, calculateResize, normalizeCrop } from './logic';

describe('image logic', () => {
  it('preserves aspect ratio when one resize side is provided', () => {
    expect(calculateResize({ width: 1600, height: 900 }, { width: 800 })).toEqual({
      width: 800,
      height: 450,
    });
  });

  it('clamps crop boundaries to the source image', () => {
    expect(
      normalizeCrop({ width: 100, height: 80 }, { left: 90, top: -1, width: 30, height: 100 }),
    ).toEqual({
      left: 90,
      top: 0,
      width: 10,
      height: 80,
    });
  });

  it('creates a PNG-backed ICO header', () => {
    const ico = buildIcoBytes(new Uint8Array([137, 80, 78, 71]), { width: 32, height: 32 });
    expect([...ico.slice(0, 6)]).toEqual([0, 0, 1, 0, 1, 0]);
    expect([...ico.slice(22)]).toEqual([137, 80, 78, 71]);
  });
});
