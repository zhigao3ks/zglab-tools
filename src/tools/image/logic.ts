import type { ImageCrop, ImageDimensions, ImageOutputFormat } from './types';

export const imageFormatLabels: Record<ImageOutputFormat, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WebP',
};

export const imageFormatExtension: Record<ImageOutputFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const clampImageNumber = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));

export const calculateResize = (
  source: ImageDimensions,
  requested: Partial<ImageDimensions>,
  keepAspectRatio = true,
): ImageDimensions => {
  const width = Math.round(requested.width ?? source.width);
  const height = Math.round(requested.height ?? source.height);
  if (width < 1 || height < 1) throw new Error('宽度和高度必须大于 0。');
  if (!keepAspectRatio) return { width, height };
  if (requested.width && !requested.height) {
    return { width, height: Math.max(1, Math.round((source.height / source.width) * width)) };
  }
  if (requested.height && !requested.width) {
    return { width: Math.max(1, Math.round((source.width / source.height) * height)), height };
  }
  return { width, height };
};

export const normalizeCrop = (source: ImageDimensions, crop: Partial<ImageCrop>): ImageCrop => {
  const left = clampImageNumber(Math.round(crop.left ?? 0), 0, Math.max(0, source.width - 1));
  const top = clampImageNumber(Math.round(crop.top ?? 0), 0, Math.max(0, source.height - 1));
  return {
    left,
    top,
    width: clampImageNumber(Math.round(crop.width ?? source.width - left), 1, source.width - left),
    height: clampImageNumber(
      Math.round(crop.height ?? source.height - top),
      1,
      source.height - top,
    ),
  };
};

export const outputFormatFromInput = (type: string): ImageOutputFormat =>
  type === 'image/png' || type === 'image/jpeg' || type === 'image/webp' ? type : 'image/png';

export const formatImageBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

const write16 = (bytes: Uint8Array, offset: number, value: number): void => {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >>> 8) & 255;
};

const write32 = (bytes: Uint8Array, offset: number, value: number): void => {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >>> 8) & 255;
  bytes[offset + 2] = (value >>> 16) & 255;
  bytes[offset + 3] = (value >>> 24) & 255;
};

export const buildIcoBytes = (png: Uint8Array, dimensions: ImageDimensions): Uint8Array => {
  if (png.length === 0) throw new Error('ICO 需要有效的 PNG 图像数据。');
  const result = new Uint8Array(22 + png.length);
  write16(result, 0, 0);
  write16(result, 2, 1);
  write16(result, 4, 1);
  result[6] = dimensions.width >= 256 ? 0 : clampImageNumber(dimensions.width, 1, 255);
  result[7] = dimensions.height >= 256 ? 0 : clampImageNumber(dimensions.height, 1, 255);
  result[8] = 0;
  result[9] = 0;
  write16(result, 10, 1);
  write16(result, 12, 32);
  write32(result, 14, png.length);
  write32(result, 18, 22);
  result.set(png, 22);
  return result;
};
