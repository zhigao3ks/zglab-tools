export type TimestampUnit = 'auto' | 'seconds' | 'milliseconds';

export interface DatePartsInput {
  date: string;
  time: string;
  timeZone: 'local' | string;
}

export interface TimestampConversion {
  milliseconds: number;
  seconds: number;
  detectedUnit: Exclude<TimestampUnit, 'auto'>;
  iso: string;
  utc: string;
  local: string;
  zoned: string;
  relative: string;
}

export type TimestampResult =
  { ok: true; value: TimestampConversion } | { ok: false; error: string };
