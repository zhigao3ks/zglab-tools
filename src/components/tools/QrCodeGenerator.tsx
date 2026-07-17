import { useEffect, useMemo, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import {
  buildQrPayload,
  createQrFilename,
  DEFAULT_QR_SETTINGS,
  generateQrPngDataUrl,
  generateQrSvg,
  getContrastRatio,
  validateQrContent,
} from '../../tools/qrcode/logic';
import type {
  QrContentType,
  QrErrorCorrectionLevel,
  QrSettings,
  WifiEncryption,
  WifiPayload,
} from '../../tools/qrcode/types';
import { dataUrlToBlob, downloadBlob, downloadText } from '../../utils/download';

const sampleByType: Record<Exclude<QrContentType, 'wifi'>, string> = {
  text: 'ZGLab Tools：数据在浏览器本地处理。',
  url: 'https://tools.zglab.fun',
  email: 'huangzg443@gmail.com',
  phone: '+8613800000000',
};

const initialWifi: WifiPayload = {
  ssid: '',
  password: '',
  encryption: 'WPA',
  hidden: false,
};

export function QrCodeGenerator() {
  const [type, setType] = useState<QrContentType>('text');
  const [value, setValue] = useState('');
  const [wifi, setWifi] = useState<WifiPayload>(initialWifi);
  const [settings, setSettings] = useState<QrSettings>(DEFAULT_QR_SETTINGS);
  const [payload, setPayload] = useState('');
  const [preview, setPreview] = useState('');
  const [bytes, setBytes] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const contrastRatio = useMemo(
    () =>
      settings.transparentBackground
        ? null
        : getContrastRatio(settings.foreground, settings.background),
    [settings.background, settings.foreground, settings.transparentBackground],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreview('');
      setPayload('');
      setError('');
      try {
        const nextPayload = buildQrPayload({ type, value, wifi });
        const validation = validateQrContent(nextPayload, settings.errorCorrectionLevel);
        setBytes(validation.bytes);
        if (!validation.valid) throw new Error(validation.error);
        setBusy(true);
        const nextPreview = await generateQrPngDataUrl(nextPayload, settings);
        if (!cancelled) {
          setPayload(nextPayload);
          setPreview(nextPreview);
        }
      } catch (caught) {
        if (!cancelled) {
          const message = caught instanceof Error ? caught.message : '二维码生成失败。';
          if (value.trim() !== '' || (type === 'wifi' && wifi.ssid.trim() !== '')) {
            setError(message);
          } else {
            setBytes(0);
          }
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [settings, type, value, wifi]);

  const updateSettings = <Key extends keyof QrSettings>(key: Key, next: QrSettings[Key]) =>
    setSettings((current) => ({ ...current, [key]: next }));

  const clear = () => {
    setValue('');
    setWifi(initialWifi);
    setPreview('');
    setPayload('');
    setError('');
    setBytes(0);
  };

  const loadSample = () => {
    if (type === 'wifi') {
      setWifi({
        ssid: 'ZGLab-Guest',
        password: 'local-only-demo',
        encryption: 'WPA',
        hidden: false,
      });
    } else {
      setValue(sampleByType[type]);
    }
  };

  const downloadPng = async () => {
    if (!preview) throw new Error('没有可下载的二维码。');
    downloadBlob(await dataUrlToBlob(preview), createQrFilename('png'));
  };

  const downloadSvg = async () => {
    if (!payload) throw new Error('没有可下载的二维码。');
    const svg = await generateQrSvg(payload, settings);
    downloadText(svg, createQrFilename('svg'), 'image/svg+xml;charset=utf-8');
  };

  return (
    <div class="tool-app qr-tool">
      <div class="qr-layout">
        <section class="form-panel qr-input-panel">
          <header>
            <span class="panel-label">QR CONTENT</span>
            <h2>二维码内容</h2>
          </header>
          <div class="segmented-control qr-type-control" aria-label="二维码内容类型">
            {(['text', 'url', 'email', 'phone', 'wifi'] as QrContentType[]).map((item) => (
              <button type="button" aria-pressed={type === item} onClick={() => setType(item)}>
                {item === 'text'
                  ? '文本'
                  : item === 'url'
                    ? 'URL'
                    : item === 'email'
                      ? '邮箱'
                      : item === 'phone'
                        ? '电话'
                        : 'Wi-Fi'}
              </button>
            ))}
          </div>

          {type === 'wifi' ? (
            <div class="field-grid">
              <label class="field field-wide">
                <span>SSID</span>
                <input
                  type="text"
                  value={wifi.ssid}
                  onInput={(event) =>
                    setWifi((current) => ({ ...current, ssid: event.currentTarget.value }))
                  }
                  autoComplete="off"
                />
              </label>
              <label class="field">
                <span>加密方式</span>
                <select
                  value={wifi.encryption}
                  onChange={(event) =>
                    setWifi((current) => ({
                      ...current,
                      encryption: event.currentTarget.value as WifiEncryption,
                    }))
                  }
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">无密码</option>
                </select>
              </label>
              <label class="field">
                <span>密码</span>
                <input
                  type="password"
                  value={wifi.password}
                  disabled={wifi.encryption === 'nopass'}
                  onInput={(event) =>
                    setWifi((current) => ({ ...current, password: event.currentTarget.value }))
                  }
                  autoComplete="new-password"
                />
              </label>
              <label class="toggle-control field-wide">
                <input
                  type="checkbox"
                  checked={wifi.hidden}
                  onChange={(event) =>
                    setWifi((current) => ({ ...current, hidden: event.currentTarget.checked }))
                  }
                />
                <span>隐藏网络</span>
              </label>
            </div>
          ) : (
            <label class="field">
              <span>
                {type === 'text'
                  ? '普通文本'
                  : type === 'url'
                    ? 'URL'
                    : type === 'email'
                      ? '邮箱地址'
                      : '电话号码'}
              </span>
              <textarea
                value={value}
                onInput={(event) => setValue(event.currentTarget.value)}
                placeholder={
                  type === 'url'
                    ? 'https://tools.zglab.fun'
                    : type === 'email'
                      ? 'name@example.com'
                      : type === 'phone'
                        ? '+8613800000000'
                        : '输入需要编码的文本'
                }
              />
            </label>
          )}

          <ToolActions>
            <button class="action-button" type="button" onClick={loadSample}>
              加载示例
            </button>
            <ClearButton
              onClear={clear}
              disabled={value === '' && wifi.ssid === '' && preview === ''}
            />
            <CopyButton text={payload} label="复制原始内容" disabled={payload === ''} />
          </ToolActions>
          <p class="content-length">二维码内容长度：{bytes.toLocaleString('zh-CN')} UTF-8 字节</p>
        </section>

        <section class="qr-preview-panel">
          <header>
            <span class="panel-label">LOCAL PREVIEW</span>
            <h2>实时预览</h2>
          </header>
          <div class="qr-preview">
            {busy ? (
              <span>正在本地生成…</span>
            ) : preview ? (
              <img
                src={preview}
                alt="本地生成的二维码预览"
                width={settings.size}
                height={settings.size}
              />
            ) : (
              <span>输入内容后在此生成二维码</span>
            )}
          </div>
          {error && <ToolNotice tone="error">{error}</ToolNotice>}
          {contrastRatio !== null && contrastRatio < 3 && (
            <ToolNotice tone="warning">
              当前前景色与背景色对比度为 {contrastRatio.toFixed(2)}:1，可能影响扫码成功率。
            </ToolNotice>
          )}
          {settings.transparentBackground && (
            <ToolNotice tone="warning">透明背景在复杂底图上可能降低扫码成功率。</ToolNotice>
          )}
          <ToolActions>
            <DownloadButton label="下载 PNG" disabled={!preview || busy} onDownload={downloadPng} />
            <DownloadButton label="下载 SVG" disabled={!payload || busy} onDownload={downloadSvg} />
          </ToolActions>
        </section>
      </div>

      <section class="qr-settings">
        <header>
          <div>
            <span class="panel-label">QR SETTINGS</span>
            <h2>二维码样式</h2>
          </div>
          <button
            class="action-button action-button-quiet"
            type="button"
            onClick={() => setSettings(DEFAULT_QR_SETTINGS)}
          >
            重置样式
          </button>
        </header>
        <div class="qr-settings-grid">
          <label class="field">
            <span>尺寸</span>
            <select
              value={settings.size}
              onChange={(event) => updateSettings('size', Number(event.currentTarget.value))}
            >
              {[192, 256, 320, 480, 640].map((size) => (
                <option value={size}>
                  {size} × {size}
                </option>
              ))}
            </select>
          </label>
          <label class="field">
            <span>边距</span>
            <input
              type="number"
              min="0"
              max="12"
              value={settings.margin}
              onInput={(event) => updateSettings('margin', Number(event.currentTarget.value))}
            />
          </label>
          <label class="field">
            <span>纠错等级</span>
            <select
              value={settings.errorCorrectionLevel}
              onChange={(event) =>
                updateSettings(
                  'errorCorrectionLevel',
                  event.currentTarget.value as QrErrorCorrectionLevel,
                )
              }
            >
              <option value="L">L · 约 7%</option>
              <option value="M">M · 约 15%</option>
              <option value="Q">Q · 约 25%</option>
              <option value="H">H · 约 30%</option>
            </select>
          </label>
          <label class="field color-field">
            <span>前景色</span>
            <input
              type="color"
              value={settings.foreground}
              onInput={(event) => updateSettings('foreground', event.currentTarget.value)}
            />
          </label>
          <label class="field color-field">
            <span>背景色</span>
            <input
              type="color"
              value={settings.background}
              disabled={settings.transparentBackground}
              onInput={(event) => updateSettings('background', event.currentTarget.value)}
            />
          </label>
          <label class="toggle-control">
            <input
              type="checkbox"
              checked={settings.transparentBackground}
              onChange={(event) =>
                updateSettings('transparentBackground', event.currentTarget.checked)
              }
            />
            <span>透明背景</span>
          </label>
        </div>
      </section>
    </div>
  );
}
