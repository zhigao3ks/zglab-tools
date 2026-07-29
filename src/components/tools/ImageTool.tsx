import { useEffect, useRef, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { bytesToBase64 } from '../../tools/base64/logic';
import {
  buildIcoBytes,
  calculateResize,
  formatImageBytes,
  imageFormatExtension,
  imageFormatLabels,
  normalizeCrop,
  outputFormatFromInput,
} from '../../tools/image/logic';
import type { ImageCrop, ImageDimensions, ImageOutputFormat } from '../../tools/image/types';
import { downloadBlob, downloadText } from '../../utils/download';

export type ImageToolMode =
  'compress' | 'resize' | 'convert' | 'crop' | 'round' | 'base64' | 'ico' | 'picker';

interface ImageToolProps {
  mode: ImageToolMode;
}

const titles: Record<ImageToolMode, string> = {
  compress: '图片压缩',
  resize: '图片尺寸调整',
  convert: '图片格式转换',
  crop: '图片裁剪',
  round: '图片圆角处理',
  base64: '图片转 Base64',
  ico: 'ICO 图标生成',
  picker: '图片取色器',
};

const loadImage = async (file: File): Promise<HTMLImageElement> => {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('无法读取该图片文件。'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: ImageOutputFormat,
  quality: number,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('浏览器无法导出该图片格式。'))),
      type,
      quality,
    );
  });

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
): void => {
  const value = Math.min(Math.max(0, radius), width / 2, height / 2);
  context.beginPath();
  context.moveTo(value, 0);
  context.lineTo(width - value, 0);
  context.quadraticCurveTo(width, 0, width, value);
  context.lineTo(width, height - value);
  context.quadraticCurveTo(width, height, width - value, height);
  context.lineTo(value, height);
  context.quadraticCurveTo(0, height, 0, height - value);
  context.lineTo(0, value);
  context.quadraticCurveTo(0, 0, value, 0);
  context.closePath();
};

const renderImage = (
  image: HTMLImageElement,
  crop: ImageCrop,
  dimensions: ImageDimensions,
  radius = 0,
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器不支持 Canvas。');
  if (radius > 0) {
    drawRoundedRect(context, canvas.width, canvas.height, radius);
    context.clip();
  }
  context.drawImage(
    image,
    crop.left,
    crop.top,
    crop.width,
    crop.height,
    0,
    0,
    dimensions.width,
    dimensions.height,
  );
  return canvas;
};

const rgbToHex = (red: number, green: number, blue: number): string =>
  `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toLocaleUpperCase()}`;

const rgbToHslLabel = (red: number, green: number, blue: number): string => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return `hsl(${hue} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%)`;
};

export function ImageTool({ mode }: ImageToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [source, setSource] = useState<ImageDimensions | null>(null);
  const [format, setFormat] = useState<ImageOutputFormat>('image/webp');
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [keepAspect, setKeepAspect] = useState(true);
  const [crop, setCrop] = useState<Partial<ImageCrop>>({});
  const [radius, setRadius] = useState(32);
  const [icoSize, setIcoSize] = useState(64);
  const [outputUrl, setOutputUrl] = useState('');
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [base64, setBase64] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<{ hex: string; rgb: string; hsl: string } | null>(null);
  const pickerCanvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setSourceUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!outputUrl) return;
    return () => URL.revokeObjectURL(outputUrl);
  }, [outputUrl]);

  useEffect(() => {
    if (mode !== 'picker' || !file || !pickerCanvas.current) return;
    let active = true;
    void loadImage(file).then((image) => {
      if (!active || !pickerCanvas.current) return;
      const scale = Math.min(1, 900 / image.naturalWidth, 520 / image.naturalHeight);
      const canvas = pickerCanvas.current;
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      context?.drawImage(image, 0, 0, canvas.width, canvas.height);
    });
    return () => {
      active = false;
    };
  }, [file, mode]);

  const selectFile = async (nextFile: File | undefined) => {
    if (!nextFile) return;
    setError('');
    setMessage('');
    setOutputBlob(null);
    setOutputUrl('');
    setBase64('');
    setPicked(null);
    try {
      const image = await loadImage(nextFile);
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
      setFile(nextFile);
      setSource(dimensions);
      setWidth(dimensions.width);
      setHeight(dimensions.height);
      setCrop({ left: 0, top: 0, width: dimensions.width, height: dimensions.height });
      setFormat(outputFormatFromInput(nextFile.type));
      setMessage(
        `已在本地加载 ${nextFile.name}（${dimensions.width} × ${dimensions.height}，${formatImageBytes(nextFile.size)}）。`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法读取图片。');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const run = async () => {
    if (!file || !source || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'base64') {
        const bytes = new Uint8Array(await file.arrayBuffer());
        setBase64(`data:${file.type || 'application/octet-stream'};base64,${bytesToBase64(bytes)}`);
        setMessage('图片已转换为 Data URL Base64。');
        return;
      }
      const image = await loadImage(file);
      const sourceCrop =
        mode === 'crop' ? normalizeCrop(source, crop) : { left: 0, top: 0, ...source };
      const dimensions =
        mode === 'resize'
          ? calculateResize(
              source,
              {
                width: typeof width === 'number' ? width : undefined,
                height: typeof height === 'number' ? height : undefined,
              },
              keepAspect,
            )
          : mode === 'crop'
            ? { width: sourceCrop.width, height: sourceCrop.height }
            : mode === 'ico'
              ? { width: icoSize, height: icoSize }
              : source;
      const icoCrop =
        mode === 'ico'
          ? (() => {
              const edge = Math.min(source.width, source.height);
              return {
                left: Math.round((source.width - edge) / 2),
                top: Math.round((source.height - edge) / 2),
                width: edge,
                height: edge,
              };
            })()
          : sourceCrop;
      const canvas = renderImage(image, icoCrop, dimensions, mode === 'round' ? radius : 0);
      if (mode === 'ico') {
        const png = await canvasToBlob(canvas, 'image/png', 1);
        const pngBytes = new Uint8Array(await png.arrayBuffer());
        const icoBytes = buildIcoBytes(pngBytes, dimensions);
        const icoBuffer = icoBytes.buffer.slice(
          icoBytes.byteOffset,
          icoBytes.byteOffset + icoBytes.byteLength,
        ) as ArrayBuffer;
        const ico = new Blob([icoBuffer], { type: 'image/x-icon' });
        setOutputBlob(ico);
        setOutputUrl(URL.createObjectURL(ico));
        setMessage(`已生成 ${icoSize} × ${icoSize} 的 ICO 图标。`);
        return;
      }
      const targetFormat = mode === 'round' || mode === 'crop' ? 'image/png' : format;
      const blob = await canvasToBlob(canvas, targetFormat, quality / 100);
      setOutputBlob(blob);
      setOutputUrl(URL.createObjectURL(blob));
      const change =
        mode === 'compress'
          ? `，大小 ${formatImageBytes(file.size)} → ${formatImageBytes(blob.size)}`
          : '';
      setMessage(`${titles[mode]}完成：${dimensions.width} × ${dimensions.height}${change}。`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '图片处理失败。');
    } finally {
      setBusy(false);
    }
  };

  const pickColor = (event: MouseEvent) => {
    const canvas = pickerCanvas.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(
      canvas.width - 1,
      Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)),
    );
    const y = Math.min(
      canvas.height - 1,
      Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)),
    );
    const pixel = canvas.getContext('2d')?.getImageData(x, y, 1, 1).data;
    if (!pixel) return;
    setPicked({
      hex: rgbToHex(pixel[0], pixel[1], pixel[2]),
      rgb: `rgb(${pixel[0]} ${pixel[1]} ${pixel[2]} / ${(pixel[3] / 255).toFixed(2)})`,
      hsl: rgbToHslLabel(pixel[0], pixel[1], pixel[2]),
    });
  };

  const clear = () => {
    setFile(null);
    setSource(null);
    setSourceUrl('');
    setOutputBlob(null);
    setOutputUrl('');
    setBase64('');
    setMessage('');
    setError('');
    setPicked(null);
  };

  const outputExtension =
    mode === 'ico'
      ? 'ico'
      : imageFormatExtension[mode === 'round' || mode === 'crop' ? 'image/png' : format];
  const hasOutput = mode === 'base64' ? base64 !== '' : outputBlob !== null;

  return (
    <div class="tool-app image-tool">
      <section class="image-source-panel">
        <input
          ref={fileInput}
          class="visually-hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
          onChange={(event) => void selectFile(event.currentTarget.files?.[0])}
        />
        <button class="image-upload" type="button" onClick={() => fileInput.current?.click()}>
          <span>＋</span>
          <strong>{file ? '更换本地图片' : '选择本地图片'}</strong>
          <small>PNG、JPG、WebP、GIF、BMP · 不上传</small>
        </button>
        {source && (
          <span class="image-source-meta">
            {source.width} × {source.height} · {file ? formatImageBytes(file.size) : ''}
          </span>
        )}
      </section>

      {file && source && mode !== 'picker' && (
        <section class="image-options">
          {(mode === 'compress' || mode === 'convert') && (
            <label class="field">
              <span>输出格式</span>
              <select
                value={format}
                onChange={(event) => setFormat(event.currentTarget.value as ImageOutputFormat)}
              >
                {(Object.keys(imageFormatLabels) as ImageOutputFormat[]).map((item) => (
                  <option value={item}>{imageFormatLabels[item]}</option>
                ))}
              </select>
            </label>
          )}
          {(mode === 'compress' || mode === 'convert') && format !== 'image/png' && (
            <label class="field">
              <span>质量：{quality}</span>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onInput={(event) => setQuality(Number(event.currentTarget.value))}
              />
            </label>
          )}
          {mode === 'resize' && (
            <>
              <label class="field">
                <span>宽度（px）</span>
                <input
                  type="number"
                  min="1"
                  value={width}
                  onInput={(event) => {
                    setWidth(Number(event.currentTarget.value));
                    if (keepAspect && source)
                      setHeight(
                        Math.max(
                          1,
                          Math.round(
                            (source.height / source.width) * Number(event.currentTarget.value),
                          ),
                        ),
                      );
                  }}
                />
              </label>
              <label class="field">
                <span>高度（px）</span>
                <input
                  type="number"
                  min="1"
                  value={height}
                  onInput={(event) => {
                    setHeight(Number(event.currentTarget.value));
                    if (keepAspect && source)
                      setWidth(
                        Math.max(
                          1,
                          Math.round(
                            (source.width / source.height) * Number(event.currentTarget.value),
                          ),
                        ),
                      );
                  }}
                />
              </label>
              <label class="toggle-control">
                <input
                  type="checkbox"
                  checked={keepAspect}
                  onChange={(event) => setKeepAspect(event.currentTarget.checked)}
                />
                <span>保持原始比例</span>
              </label>
              <label class="field">
                <span>输出格式</span>
                <select
                  value={format}
                  onChange={(event) => setFormat(event.currentTarget.value as ImageOutputFormat)}
                >
                  {(Object.keys(imageFormatLabels) as ImageOutputFormat[]).map((item) => (
                    <option value={item}>{imageFormatLabels[item]}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {mode === 'crop' && (
            <>
              <label class="field">
                <span>左侧（px）</span>
                <input
                  type="number"
                  min="0"
                  value={crop.left ?? 0}
                  onInput={(event) =>
                    setCrop((current) => ({ ...current, left: Number(event.currentTarget.value) }))
                  }
                />
              </label>
              <label class="field">
                <span>顶部（px）</span>
                <input
                  type="number"
                  min="0"
                  value={crop.top ?? 0}
                  onInput={(event) =>
                    setCrop((current) => ({ ...current, top: Number(event.currentTarget.value) }))
                  }
                />
              </label>
              <label class="field">
                <span>裁剪宽度（px）</span>
                <input
                  type="number"
                  min="1"
                  value={crop.width ?? source?.width ?? 1}
                  onInput={(event) =>
                    setCrop((current) => ({ ...current, width: Number(event.currentTarget.value) }))
                  }
                />
              </label>
              <label class="field">
                <span>裁剪高度（px）</span>
                <input
                  type="number"
                  min="1"
                  value={crop.height ?? source?.height ?? 1}
                  onInput={(event) =>
                    setCrop((current) => ({
                      ...current,
                      height: Number(event.currentTarget.value),
                    }))
                  }
                />
              </label>
            </>
          )}
          {mode === 'round' && (
            <label class="field">
              <span>圆角半径：{radius}px</span>
              <input
                type="range"
                min="0"
                max={Math.floor(Math.min(source?.width ?? 2, source?.height ?? 2) / 2)}
                value={radius}
                onInput={(event) => setRadius(Number(event.currentTarget.value))}
              />
            </label>
          )}
          {mode === 'ico' && (
            <label class="field">
              <span>ICO 尺寸</span>
              <select
                value={icoSize}
                onChange={(event) => setIcoSize(Number(event.currentTarget.value))}
              >
                {[16, 32, 48, 64, 128, 256].map((item) => (
                  <option value={item}>
                    {item} × {item}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>
      )}

      {file && mode === 'picker' && (
        <section class="picker-panel">
          <canvas ref={pickerCanvas} onClick={pickColor} aria-label="点击图片取色" />
          {picked ? (
            <div class="picked-color">
              <span style={{ background: picked.hex }} />
              <code>{picked.hex}</code>
              <code>{picked.rgb}</code>
              <code>{picked.hsl}</code>
              <CopyButton text={picked.hex} label="复制 HEX" />
            </div>
          ) : (
            <p>点击图片中的任意像素取色。</p>
          )}
        </section>
      )}

      {file && mode !== 'picker' && (
        <div class="image-preview-grid">
          <section>
            <span class="panel-label">SOURCE</span>
            <img src={sourceUrl} alt="本地图片原始预览" />
          </section>
          <section>
            <span class="panel-label">OUTPUT</span>
            {outputUrl ? <img src={outputUrl} alt="本地图片处理结果预览" /> : <p>处理结果预览</p>}
          </section>
        </div>
      )}

      {file && mode !== 'picker' && (
        <ToolActions className="line-actions">
          <button
            class="action-button action-button-primary"
            type="button"
            onClick={() => void run()}
            disabled={busy}
          >
            {busy ? '处理中…' : mode === 'base64' ? '转换 Base64' : `开始${titles[mode]}`}
          </button>
          {mode === 'base64' && (
            <CopyButton text={base64} disabled={base64 === ''} label="复制 Base64" />
          )}{' '}
          {mode === 'base64' && (
            <DownloadButton
              disabled={base64 === ''}
              label="下载 TXT"
              onDownload={() => downloadText(base64, 'zglab-image-base64.txt')}
            />
          )}{' '}
          {mode !== 'base64' && (
            <DownloadButton
              disabled={!hasOutput || !outputBlob}
              label={`下载 ${outputExtension.toUpperCase()}`}
              onDownload={() => {
                if (outputBlob) downloadBlob(outputBlob, `zglab-image.${outputExtension}`);
              }}
            />
          )}
          <ClearButton onClear={clear} disabled={!file && !hasOutput} />
        </ToolActions>
      )}
      {message && <ToolNotice tone="success">{message}</ToolNotice>}
      {error && <ToolNotice tone="error">{error}</ToolNotice>}
      <ToolNotice>
        图片读取、Canvas 处理、格式导出和取色都只在当前浏览器完成。透明圆角会导出为 PNG；ICO 使用
        PNG 图层封装。
      </ToolNotice>
    </div>
  );
}
