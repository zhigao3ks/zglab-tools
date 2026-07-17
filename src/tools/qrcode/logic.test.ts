import { describe, expect, it } from 'vitest';
import {
  buildQrPayload,
  buildWifiPayload,
  createQrFilename,
  DEFAULT_QR_SETTINGS,
  generateQrPngDataUrl,
  generateQrSvg,
  getContrastRatio,
  validateQrContent,
} from './logic';

describe('QR payloads', () => {
  it('keeps plain text, URL, Chinese and emoji content', () => {
    expect(buildQrPayload({ type: 'text', value: '你好 😀' })).toBe('你好 😀');
    expect(buildQrPayload({ type: 'url', value: 'https://tools.zglab.fun' })).toBe(
      'https://tools.zglab.fun',
    );
  });

  it('creates mailto and tel payloads', () => {
    expect(buildQrPayload({ type: 'email', value: 'hello@example.com' })).toBe(
      'mailto:hello@example.com',
    );
    expect(buildQrPayload({ type: 'phone', value: '+8613800000000' })).toBe('tel:+8613800000000');
  });

  it('escapes Wi-Fi values', () => {
    const payload = buildWifiPayload({
      ssid: 'Lab;WiFi',
      password: 'p:a\\ss',
      encryption: 'WPA',
      hidden: true,
    });
    expect(payload).toBe('WIFI:T:WPA;S:Lab\\;WiFi;P:p\\:a\\\\ss;H:true;;');
  });

  it('omits the password field for open Wi-Fi', () => {
    const payload = buildQrPayload({
      type: 'wifi',
      value: '',
      wifi: { ssid: 'Guest', password: 'ignored', encryption: 'nopass', hidden: false },
    });
    expect(payload).toBe('WIFI:T:nopass;S:Guest;H:false;;');
  });

  it('rejects empty input', () => {
    expect(() => buildQrPayload({ type: 'text', value: '  ' })).toThrow('请输入');
  });
});

describe('QR generation', () => {
  it('generates an SVG entry point', async () => {
    const svg = await generateQrSvg('ZGLab Tools', DEFAULT_QR_SETTINGS);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
  });

  it('generates a PNG data URL entry point', async () => {
    const png = await generateQrPngDataUrl('ZGLab Tools', {
      ...DEFAULT_QR_SETTINGS,
      size: 128,
    });
    expect(png).toMatch(/^data:image\/png;base64,/);
  });

  it('validates content length for each correction level', () => {
    expect(validateQrContent('hello', 'H').valid).toBe(true);
    expect(validateQrContent('a'.repeat(1300), 'H').valid).toBe(false);
  });

  it('generates the required filename format', () => {
    const date = new Date(2026, 6, 17, 9, 8, 7);
    expect(createQrFilename('png', date)).toBe('zglab-qr-20260717-090807.png');
    expect(createQrFilename('svg', date)).toBe('zglab-qr-20260717-090807.svg');
  });

  it('calculates color contrast', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(getContrastRatio('#777777', '#777777')).toBe(1);
  });
});
