import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64, decodeBase64ToText, encodeTextToBase64 } from './logic';

describe('Base64 logic', () => {
  it('round trips Unicode text', () => {
    const encoded = encodeTextToBase64('中文、Emoji 😀 and text');
    expect(decodeBase64ToText(encoded).text).toBe('中文、Emoji 😀 and text');
  });

  it('round trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255]);
    expect([...base64ToBytes(bytesToBase64(bytes))]).toEqual([...bytes]);
  });

  it('accepts URL-safe Base64 and whitespace', () => {
    expect(decodeBase64ToText('5Lit\n5paH').text).toBe('中文');
  });

  it('rejects invalid input', () => {
    expect(() => base64ToBytes('abcde')).toThrow('长度');
  });
});
