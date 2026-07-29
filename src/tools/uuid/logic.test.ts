import { describe, expect, it } from 'vitest';
import { deduplicateUuids, generateUuidV4, isUuidV4 } from './logic';

describe('UUID logic', () => {
  it('sets version and variant bits for v4', () => {
    expect(generateUuidV4((bytes) => bytes.fill(0))).toBe('00000000-0000-4000-8000-000000000000');
  });

  it('validates v4 UUIDs', () => {
    expect(isUuidV4('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isUuidV4('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
  });

  it('deduplicates normalised UUID lines and reports invalid lines', () => {
    const result = deduplicateUuids(
      '550E8400-E29B-41D4-A716-446655440000\n550e8400-e29b-41d4-a716-446655440000\nnot-a-uuid',
    );
    expect(result.values).toHaveLength(1);
    expect(result.removed).toBe(1);
    expect(result.invalid).toEqual(['not-a-uuid']);
  });
});
