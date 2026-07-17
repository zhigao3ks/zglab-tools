const pad = (value: number): string => String(value).padStart(2, '0');

export const createTimestampedFilename = (
  toolName: string,
  extension: string,
  date = new Date(),
): string =>
  `zglab-${toolName}-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.${extension}`;

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const downloadText = (
  content: string,
  filename: string,
  type = 'text/plain;charset=utf-8',
): void => {
  downloadBlob(new Blob([content], { type }), filename);
};

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const separator = dataUrl.indexOf(',');
  if (separator < 0 || !dataUrl.startsWith('data:')) {
    throw new Error('无法读取本地生成的文件。');
  }

  const metadata = dataUrl.slice(5, separator);
  const encoded = dataUrl.slice(separator + 1);
  const isBase64 = metadata.endsWith(';base64');
  const mimeType = metadata.replace(/;base64$/u, '') || 'application/octet-stream';

  try {
    if (!isBase64) {
      return new Blob([decodeURIComponent(encoded)], { type: mimeType });
    }

    const binary = window.atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mimeType });
  } catch {
    throw new Error('本地生成的文件数据无效。');
  }
};
