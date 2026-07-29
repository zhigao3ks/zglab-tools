import { describe, expect, it } from 'vitest';
import { calculateHash, md5 } from './logic';

describe('hash logic', () => {
  it('calculates known MD5 vectors', () => {
    expect(md5(new TextEncoder().encode(''))).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5(new TextEncoder().encode('abc'))).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5(new TextEncoder().encode('中文'))).toBe('a7bac2239fcdcb3a067903d8077c4a07');
  });

  it('calculates SHA-256 with Web Crypto', async () => {
    await expect(calculateHash(new TextEncoder().encode('abc'), 'SHA-256')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
