import type { HashAlgorithm, HashResult } from './types';

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
] as const;

const MD5_CONSTANTS = Array.from(
  { length: 64 },
  (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32) >>> 0,
);

const leftRotate = (value: number, amount: number): number =>
  ((value << amount) | (value >>> (32 - amount))) >>> 0;

const writeLittleEndian = (target: Uint8Array, offset: number, value: number): void => {
  target[offset] = value & 255;
  target[offset + 1] = (value >>> 8) & 255;
  target[offset + 2] = (value >>> 16) & 255;
  target[offset + 3] = (value >>> 24) & 255;
};

const readLittleEndian = (source: Uint8Array, offset: number): number =>
  (source[offset] |
    (source[offset + 1] << 8) |
    (source[offset + 2] << 16) |
    (source[offset + 3] << 24)) >>>
  0;

const bytesToHex = (bytes: Uint8Array): string =>
  [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');

export const md5 = (input: Uint8Array): string => {
  const originalLength = input.length;
  const paddedLength = Math.floor((originalLength + 8) / 64 + 1) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[originalLength] = 128;

  const bitLength = BigInt(originalLength) * 8n;
  for (let index = 0; index < 8; index += 1) {
    padded[paddedLength - 8 + index] = Number((bitLength >> BigInt(index * 8)) & 255n);
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = Array.from({ length: 16 }, (_, index) =>
      readLittleEndian(padded, offset + index * 4),
    );
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let index = 0; index < 64; index += 1) {
      let f: number;
      let g: number;
      if (index < 16) {
        f = (b & c) | (~b & d);
        g = index;
      } else if (index < 32) {
        f = (d & b) | (~d & c);
        g = (5 * index + 1) % 16;
      } else if (index < 48) {
        f = b ^ c ^ d;
        g = (3 * index + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * index) % 16;
      }
      const nextD = d;
      d = c;
      c = b;
      b =
        (b + leftRotate((a + f + MD5_CONSTANTS[index] + words[g]) >>> 0, MD5_SHIFTS[index])) >>> 0;
      a = nextD;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const result = new Uint8Array(16);
  writeLittleEndian(result, 0, a0);
  writeLittleEndian(result, 4, b0);
  writeLittleEndian(result, 8, c0);
  writeLittleEndian(result, 12, d0);
  return bytesToHex(result);
};

const cryptoName: Record<Exclude<HashAlgorithm, 'MD5'>, AlgorithmIdentifier> = {
  'SHA-1': 'SHA-1',
  'SHA-256': 'SHA-256',
  'SHA-512': 'SHA-512',
};

export const calculateHash = async (
  input: Uint8Array,
  algorithm: HashAlgorithm,
): Promise<string> => {
  if (algorithm === 'MD5') return md5(input);
  if (!globalThis.crypto?.subtle) throw new Error('当前浏览器不支持 Web Crypto 哈希。');
  const data = input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength,
  ) as ArrayBuffer;
  return bytesToHex(
    new Uint8Array(await globalThis.crypto.subtle.digest(cryptoName[algorithm], data)),
  );
};

export const calculateTextHashes = async (
  input: string,
  algorithms: HashAlgorithm[],
): Promise<HashResult[]> => {
  if (input === '') throw new Error('请输入要计算哈希的文本。');
  const bytes = new TextEncoder().encode(input);
  return Promise.all(
    algorithms.map(async (algorithm) => ({
      algorithm,
      value: await calculateHash(bytes, algorithm),
    })),
  );
};
