export const formatInteger = (value: number): string =>
  new Intl.NumberFormat('zh-CN').format(value);

export const formatReadingMinutes = (value: number): string =>
  value === 0 ? '0 分钟' : `${Math.max(0.1, value).toFixed(1)} 分钟`;

export const clampNumber = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
