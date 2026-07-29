import { base64ToBytes } from '../base64/logic';
import type { ParsedJwt } from './types';

const decodeSegment = (segment: string, label: string): Record<string, unknown> => {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(segment));
    const value: unknown = JSON.parse(text);
    if (value === null || Array.isArray(value) || typeof value !== 'object') {
      throw new Error('not object');
    }
    return value as Record<string, unknown>;
  } catch {
    throw new Error(`${label} 不是有效的 Base64URL JSON 对象。`);
  }
};

const getExpiration = (payload: Record<string, unknown>, now: Date): ParsedJwt['expiration'] => {
  const exp = payload.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return { status: 'not-set', iso: null, relativeMilliseconds: null };
  }
  const date = new Date(exp * 1000);
  if (Number.isNaN(date.getTime()))
    return { status: 'not-set', iso: null, relativeMilliseconds: null };
  const relativeMilliseconds = date.getTime() - now.getTime();
  return {
    status: relativeMilliseconds < 0 ? 'expired' : 'valid',
    iso: date.toISOString(),
    relativeMilliseconds,
  };
};

export const parseJwt = (input: string, now = new Date()): ParsedJwt => {
  const parts = input.trim().split('.');
  if (parts.length !== 3 || parts.some((part) => part === '')) {
    throw new Error('JWT 必须由 Header、Payload、Signature 三段组成。');
  }
  const header = decodeSegment(parts[0], 'Header');
  const payload = decodeSegment(parts[1], 'Payload');
  return { header, payload, signature: parts[2], expiration: getExpiration(payload, now) };
};

export const prettyJson = (value: Record<string, unknown>): string =>
  JSON.stringify(value, null, 2);
