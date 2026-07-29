import type { Base64DecodedText } from './types';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const normalizeBase64 = (input: string): string => {
  const value = input.trim().replace(/\s+/gu, '').replace(/-/gu, '+').replace(/_/gu, '/');
  if (value === '') throw new Error('请输入 Base64 内容。');
  const paddingIndex = value.indexOf('=');
  if (
    !/^[A-Za-z0-9+/]*={0,2}$/u.test(value) ||
    (paddingIndex !== -1 && paddingIndex < value.length - 2)
  ) {
    throw new Error('Base64 格式无效。');
  }

  const unpaddedLength = value.replace(/=+$/u, '').length;
  if (unpaddedLength % 4 === 1) throw new Error('Base64 长度无效。');
  return `${value.replace(/=+$/u, '')}${'='.repeat((4 - (unpaddedLength % 4)) % 4)}`;
};

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;
    output += BASE64_ALPHABET[(chunk >>> 18) & 63];
    output += BASE64_ALPHABET[(chunk >>> 12) & 63];
    output += index + 1 < bytes.length ? BASE64_ALPHABET[(chunk >>> 6) & 63] : '=';
    output += index + 2 < bytes.length ? BASE64_ALPHABET[chunk & 63] : '=';
  }
  return output;
};

export const base64ToBytes = (input: string): Uint8Array => {
  const value = normalizeBase64(input);
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const output = new Uint8Array((value.length / 4) * 3 - padding);
  let targetIndex = 0;

  for (let index = 0; index < value.length; index += 4) {
    const first = BASE64_ALPHABET.indexOf(value[index]);
    const second = BASE64_ALPHABET.indexOf(value[index + 1]);
    const third = value[index + 2] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 2]);
    const fourth = value[index + 3] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 3]);
    if ([first, second, third, fourth].some((item) => item < 0)) {
      throw new Error('Base64 包含无效字符。');
    }
    const chunk = (first << 18) | (second << 12) | (third << 6) | fourth;
    if (targetIndex < output.length) output[targetIndex++] = (chunk >>> 16) & 255;
    if (targetIndex < output.length) output[targetIndex++] = (chunk >>> 8) & 255;
    if (targetIndex < output.length) output[targetIndex++] = chunk & 255;
  }
  return output;
};

export const encodeTextToBase64 = (input: string): string => {
  if (input === '') throw new Error('请输入要编码的文本。');
  return bytesToBase64(new TextEncoder().encode(input));
};

export const decodeBase64ToText = (input: string): Base64DecodedText => {
  const bytes = base64ToBytes(input);
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), bytes };
  } catch {
    throw new Error('该 Base64 内容不是有效的 UTF-8 文本，可下载为二进制文件。');
  }
};

export const formatBase64 = (input: string, width = 76): string => {
  if (!Number.isInteger(width) || width < 4) return input;
  return (
    input
      .replace(/\s+/gu, '')
      .match(new RegExp(`.{1,${width}}`, 'g'))
      ?.join('\n') ?? ''
  );
};
