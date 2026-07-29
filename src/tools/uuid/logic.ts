import type { UuidDeduplicationResult } from './types';

export type RandomBytesFiller = (bytes: Uint8Array) => Uint8Array;

const fillWithCrypto = (bytes: Uint8Array): Uint8Array => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('当前浏览器不支持安全随机数，无法生成 UUID。');
  }
  const generated = new Uint8Array(bytes.length);
  globalThis.crypto.getRandomValues(generated);
  bytes.set(generated);
  return bytes;
};

export const generateUuidV4 = (fillBytes: RandomBytesFiller = fillWithCrypto): string => {
  const bytes = fillBytes(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const generateUuidBatch = (
  count: number,
  fillBytes: RandomBytesFiller = fillWithCrypto,
): string[] => {
  if (!Number.isInteger(count) || count < 1 || count > 10_000) {
    throw new Error('生成数量必须是 1 到 10000 之间的整数。');
  }
  const result = new Set<string>();
  while (result.size < count) result.add(generateUuidV4(fillBytes));
  return [...result];
};

export const isUuidV4 = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);

export const deduplicateUuids = (input: string): UuidDeduplicationResult => {
  const values: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let removed = 0;
  for (const rawValue of input.replace(/\r\n?/gu, '\n').split('\n')) {
    const value = rawValue.trim().toLocaleLowerCase();
    if (value === '') continue;
    if (!isUuidV4(value)) {
      invalid.push(rawValue);
      continue;
    }
    if (seen.has(value)) {
      removed += 1;
      continue;
    }
    seen.add(value);
    values.push(value);
  }
  return { values, removed, invalid };
};
