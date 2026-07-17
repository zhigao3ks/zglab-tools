import { describe, expect, it } from 'vitest';
import { datePartsToDate, detectTimestampUnit, formatRelativeTime, timestampToDate } from './logic';

describe('timestampToDate', () => {
  it('converts the Unix epoch', () => {
    const result = timestampToDate('0', 'auto', 'UTC', new Date(0));
    expect(result.ok && result.value.iso).toBe('1970-01-01T00:00:00.000Z');
    expect(result.ok && result.value.detectedUnit).toBe('seconds');
  });

  it('detects seconds and milliseconds', () => {
    expect(detectTimestampUnit(1_700_000_000)).toBe('seconds');
    expect(detectTimestampUnit(1_700_000_000_000)).toBe('milliseconds');
  });

  it('converts second and millisecond values to the same instant', () => {
    const seconds = timestampToDate('1700000000', 'seconds', 'UTC');
    const milliseconds = timestampToDate('1700000000000', 'milliseconds', 'UTC');
    expect(seconds.ok && milliseconds.ok && seconds.value.iso).toBe(
      milliseconds.ok ? milliseconds.value.iso : '',
    );
  });

  it('allows negative timestamps', () => {
    const result = timestampToDate('-1', 'seconds', 'UTC');
    expect(result.ok && result.value.iso).toBe('1969-12-31T23:59:59.000Z');
  });

  it.each(['NaN', 'Infinity', '', '9e99'])('rejects invalid input %s', (input) => {
    expect(timestampToDate(input, 'auto', 'UTC').ok).toBe(false);
  });

  it('formats a selected IANA timezone with Intl', () => {
    const result = timestampToDate('0', 'seconds', 'Asia/Shanghai');
    expect(result.ok && result.value.zoned).toContain('08:00:00');
  });
});

describe('datePartsToDate', () => {
  it('converts a leap day in UTC', () => {
    const result = datePartsToDate({
      date: '2024-02-29',
      time: '12:30:45',
      timeZone: 'UTC',
    });
    expect(result.ok && result.date.toISOString()).toBe('2024-02-29T12:30:45.000Z');
  });

  it('rejects an invalid calendar date', () => {
    const result = datePartsToDate({
      date: '2023-02-29',
      time: '12:00:00',
      timeZone: 'UTC',
    });
    expect(result.ok).toBe(false);
  });

  it('converts Asia/Shanghai to UTC', () => {
    const result = datePartsToDate({
      date: '2024-01-01',
      time: '08:00:00',
      timeZone: 'Asia/Shanghai',
    });
    expect(result.ok && result.date.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('uses Intl behavior around a daylight-saving boundary', () => {
    const before = datePartsToDate({
      date: '2024-03-10',
      time: '01:30:00',
      timeZone: 'America/New_York',
    });
    const missing = datePartsToDate({
      date: '2024-03-10',
      time: '02:30:00',
      timeZone: 'America/New_York',
    });
    expect(before.ok).toBe(true);
    expect(missing.ok).toBe(false);
  });
});

describe('formatRelativeTime', () => {
  it('describes past and future values', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(formatRelativeTime(new Date('2025-12-31T22:00:00Z'), now)).toContain('2');
    expect(formatRelativeTime(new Date('2026-01-04T00:00:00Z'), now)).toContain('3');
  });
});
