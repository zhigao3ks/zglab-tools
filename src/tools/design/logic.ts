import type { HslColor, RgbColor, ScreenRatio } from './types';

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, Math.round(value)));

const toHexPart = (value: number): string => clamp(value, 0, 255).toString(16).padStart(2, '0');

export const normalizeHex = (input: string): string => {
  const value = input.trim().replace(/^#/u, '');
  if (/^[0-9a-f]{3}$/iu.test(value))
    return `#${value
      .split('')
      .map((part) => `${part}${part}`)
      .join('')
      .toLocaleUpperCase()}`;
  if (/^[0-9a-f]{6}$/iu.test(value)) return `#${value.toLocaleUpperCase()}`;
  throw new Error('请输入 3 位或 6 位 HEX 颜色，例如 #3B82F6。');
};

export const hexToRgb = (input: string): RgbColor => {
  const hex = normalizeHex(input).slice(1);
  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16),
  };
};

export const rgbToHex = ({ red, green, blue }: RgbColor): string =>
  `#${toHexPart(red)}${toHexPart(green)}${toHexPart(blue)}`.toLocaleUpperCase();

export const rgbToHsl = ({ red, green, blue }: RgbColor): HslColor => {
  const r = clamp(red, 0, 255) / 255;
  const g = clamp(green, 0, 255) / 255;
  const b = clamp(blue, 0, 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return {
    hue: Math.round(hue),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
  };
};

export const hslToRgb = ({ hue, saturation, lightness }: HslColor): RgbColor => {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = l - chroma / 2;
  const [r, g, b] =
    h < 60
      ? [chroma, x, 0]
      : h < 120
        ? [x, chroma, 0]
        : h < 180
          ? [0, chroma, x]
          : h < 240
            ? [0, x, chroma]
            : h < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];
  return {
    red: Math.round((r + match) * 255),
    green: Math.round((g + match) * 255),
    blue: Math.round((b + match) * 255),
  };
};

export const gradientCss = (first: string, second: string, angle: number): string =>
  `linear-gradient(${clamp(angle, 0, 360)}deg, ${normalizeHex(first)}, ${normalizeHex(second)})`;

export const shadowCss = (config: {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}): string =>
  `${config.inset ? 'inset ' : ''}${Math.round(config.x)}px ${Math.round(config.y)}px ${Math.max(0, Math.round(config.blur))}px ${Math.round(config.spread)}px ${normalizeHex(config.color)}`;

export const radiusCss = (
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number,
): string =>
  `${[topLeft, topRight, bottomRight, bottomLeft].map((value) => `${Math.max(0, Math.round(value))}px`).join(' ')}`;

export const convertPixelsAndRem = (
  value: number,
  rootSize: number,
): { px: number; rem: number } => {
  if (!Number.isFinite(value) || !Number.isFinite(rootSize) || rootSize <= 0)
    throw new Error('数值和根字号必须有效，根字号需大于 0。');
  return { px: value, rem: value / rootSize };
};

const gcd = (left: number, right: number): number => {
  let a = Math.abs(Math.round(left));
  let b = Math.abs(Math.round(right));
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

export const calculateScreenRatio = (width: number, height: number): ScreenRatio => {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    throw new Error('屏幕宽高必须大于 0。');
  const divisor = gcd(width, height);
  return {
    width: Math.round(width),
    height: Math.round(height),
    ratio: `${Math.round(width) / divisor}:${Math.round(height) / divisor}`,
    decimal: Number((width / height).toFixed(4)),
    orientation: width === height ? '正方形' : width > height ? '横向' : '纵向',
  };
};
