import { describe, expect, it } from 'vitest';
import { parseJwt } from './logic';

describe('JWT logic', () => {
  it('parses Header and Payload and marks expired tokens', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3MDAwMDAwMDB9.signature';
    const result = parseJwt(token, new Date('2024-01-01T00:00:00Z'));
    expect(result.header.alg).toBe('HS256');
    expect(result.payload.sub).toBe('123');
    expect(result.expiration.status).toBe('expired');
  });

  it('rejects malformed tokens', () => {
    expect(() => parseJwt('only.two')).toThrow('三段');
  });
});
