import type { DatePartsInput, TimestampResult, TimestampUnit } from './types';

export const FALLBACK_TIME_ZONES = [
  'UTC',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'America/New_York',
  'Europe/London',
] as const;

const TIMESTAMP_AUTO_MILLISECONDS_THRESHOLD = 100_000_000_000;
const MAX_DATE_MILLISECONDS = 8_640_000_000_000_000;

const dateTimeFormatter = (timeZone?: string): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long',
    hourCycle: 'h23',
  });

export const getSupportedTimeZones = (): string[] => {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };

  try {
    return intl.supportedValuesOf?.('timeZone') ?? [...FALLBACK_TIME_ZONES];
  } catch {
    return [...FALLBACK_TIME_ZONES];
  }
};

export const detectTimestampUnit = (value: number): Exclude<TimestampUnit, 'auto'> =>
  Math.abs(value) >= TIMESTAMP_AUTO_MILLISECONDS_THRESHOLD ? 'milliseconds' : 'seconds';

export const formatRelativeTime = (date: Date, now = new Date()): string => {
  const differenceSeconds = (date.getTime() - now.getTime()) / 1000;
  const absoluteSeconds = Math.abs(differenceSeconds);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
    ['second', 1],
  ];
  const [unit, divisor] = units.find(([, seconds]) => absoluteSeconds >= seconds) ?? ['second', 1];
  return new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' }).format(
    Math.round(differenceSeconds / divisor),
    unit,
  );
};

export const timestampToDate = (
  input: string,
  unit: TimestampUnit,
  timeZone: string,
  now = new Date(),
): TimestampResult => {
  if (input.trim() === '') return { ok: false, error: '请输入时间戳。' };

  const numeric = Number(input);
  if (!Number.isFinite(numeric)) return { ok: false, error: '时间戳必须是有限数字。' };

  const detectedUnit = unit === 'auto' ? detectTimestampUnit(numeric) : unit;
  const milliseconds = detectedUnit === 'seconds' ? numeric * 1000 : numeric;

  if (!Number.isFinite(milliseconds) || Math.abs(milliseconds) > MAX_DATE_MILLISECONDS) {
    return { ok: false, error: '时间戳超出 JavaScript Date 可表示的范围。' };
  }

  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) return { ok: false, error: '无法解析该时间戳。' };

  try {
    return {
      ok: true,
      value: {
        milliseconds: date.getTime(),
        seconds: Math.trunc(date.getTime() / 1000),
        detectedUnit,
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: dateTimeFormatter().format(date),
        zoned: dateTimeFormatter(timeZone).format(date),
        relative: formatRelativeTime(date, now),
      },
    };
  } catch {
    return { ok: false, error: '浏览器不支持所选时区。' };
  }
};

interface NumericDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const parseDateParts = (input: DatePartsInput): NumericDateParts | null => {
  const dateMatch = input.date.match(/^(\d{4,6})-(\d{2})-(\d{2})$/);
  const timeMatch = input.time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!dateMatch || !timeMatch) return null;

  const parts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    second: Number(timeMatch[3] ?? 0),
  };

  if (
    parts.month < 1 ||
    parts.month > 12 ||
    parts.day < 1 ||
    parts.day > 31 ||
    parts.hour > 23 ||
    parts.minute > 59 ||
    parts.second > 59
  ) {
    return null;
  }
  return parts;
};

const sameParts = (left: NumericDateParts, right: NumericDateParts): boolean =>
  left.year === right.year &&
  left.month === right.month &&
  left.day === right.day &&
  left.hour === right.hour &&
  left.minute === right.minute &&
  left.second === right.second;

const partsFromDate = (date: Date, timeZone: string): NumericDateParts => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
};

const zonedPartsToDate = (parts: NumericDateParts, timeZone: string): Date | null => {
  const targetUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  let candidate = targetUtc;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const formatted = partsFromDate(new Date(candidate), timeZone);
    const representedUtc = Date.UTC(
      formatted.year,
      formatted.month - 1,
      formatted.day,
      formatted.hour,
      formatted.minute,
      formatted.second,
    );
    candidate += targetUtc - representedUtc;
  }

  const date = new Date(candidate);
  return sameParts(partsFromDate(date, timeZone), parts) ? date : null;
};

export const datePartsToDate = (
  input: DatePartsInput,
): { ok: true; date: Date } | { ok: false; error: string } => {
  const parts = parseDateParts(input);
  if (!parts) return { ok: false, error: '请输入有效的日期和时间。' };

  let date: Date | null;
  try {
    if (input.timeZone === 'local') {
      date = new Date(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
      );
      const localParts: NumericDateParts = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
      };
      if (!sameParts(localParts, parts)) date = null;
    } else if (input.timeZone === 'UTC') {
      date = new Date(
        Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second),
      );
      if (!sameParts(partsFromDate(date, 'UTC'), parts)) date = null;
    } else {
      date = zonedPartsToDate(parts, input.timeZone);
    }
  } catch {
    return { ok: false, error: '浏览器不支持所选时区。' };
  }

  if (!date || Number.isNaN(date.getTime())) {
    return { ok: false, error: '该日期无效，或处于时区的不存在时间段。' };
  }
  return { ok: true, date };
};
