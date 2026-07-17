import QRCode from 'qrcode';
import type { QrErrorCorrectionLevel, QrPayloadInput, QrSettings, WifiPayload } from './types';

export const DEFAULT_QR_SETTINGS: QrSettings = {
  size: 320,
  margin: 3,
  errorCorrectionLevel: 'M',
  foreground: '#172027',
  background: '#f4f0e6',
  transparentBackground: false,
};

const QR_BYTE_LIMITS: Record<QrErrorCorrectionLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

export const escapeWifiValue = (value: string): string => value.replace(/([\\;,:"])/g, '\\$1');

export const buildWifiPayload = (wifi: WifiPayload): string => {
  const type = wifi.encryption;
  const password = type === 'nopass' ? '' : `P:${escapeWifiValue(wifi.password)};`;
  return `WIFI:T:${type};S:${escapeWifiValue(wifi.ssid)};${password}H:${wifi.hidden ? 'true' : 'false'};;`;
};

export const buildQrPayload = (input: QrPayloadInput): string => {
  if (input.type === 'wifi') {
    if (!input.wifi?.ssid.trim()) throw new Error('请输入 Wi-Fi 名称（SSID）。');
    return buildWifiPayload({ ...input.wifi, ssid: input.wifi.ssid.trim() });
  }

  const value = input.value.trim();
  if (!value) throw new Error('请输入要生成二维码的内容。');
  if (input.type === 'email') return `mailto:${value}`;
  if (input.type === 'phone') return `tel:${value}`;
  return value;
};

export const validateQrContent = (
  content: string,
  level: QrErrorCorrectionLevel,
): { valid: true; bytes: number } | { valid: false; bytes: number; error: string } => {
  const bytes = new TextEncoder().encode(content).byteLength;
  if (bytes === 0) return { valid: false, bytes, error: '二维码内容不能为空。' };
  if (bytes > QR_BYTE_LIMITS[level]) {
    return {
      valid: false,
      bytes,
      error: `当前纠错等级最多建议 ${QR_BYTE_LIMITS[level]} 字节，当前为 ${bytes} 字节。`,
    };
  }
  return { valid: true, bytes };
};

const qrOptions = (settings: QrSettings) => ({
  width: settings.size,
  margin: settings.margin,
  errorCorrectionLevel: settings.errorCorrectionLevel,
  color: {
    dark: settings.foreground,
    light: settings.transparentBackground ? '#00000000' : settings.background,
  },
});

export const generateQrPngDataUrl = async (
  content: string,
  settings: QrSettings,
): Promise<string> => QRCode.toDataURL(content, { ...qrOptions(settings), type: 'image/png' });

export const generateQrSvg = async (content: string, settings: QrSettings): Promise<string> =>
  QRCode.toString(content, { ...qrOptions(settings), type: 'svg' });

const parseHex = (value: string): [number, number, number] | null => {
  const match = value.match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const hex = match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
};

const luminance = ([red, green, blue]: [number, number, number]): number => {
  const values = [red, green, blue].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
};

export const getContrastRatio = (foreground: string, background: string): number | null => {
  const foregroundRgb = parseHex(foreground);
  const backgroundRgb = parseHex(background);
  if (!foregroundRgb || !backgroundRgb) return null;
  const light = Math.max(luminance(foregroundRgb), luminance(backgroundRgb));
  const dark = Math.min(luminance(foregroundRgb), luminance(backgroundRgb));
  return (light + 0.05) / (dark + 0.05);
};

const pad = (value: number): string => String(value).padStart(2, '0');

export const createQrFilename = (extension: 'png' | 'svg', date = new Date()): string =>
  `zglab-qr-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.${extension}`;
