import { describe, expect, it } from 'vitest';
import { decodeUrlText, encodeUrlText, formatQueryParameters, parseUrl } from './logic';

describe('URL logic', () => {
  it('encodes a query component without losing Unicode', () => {
    expect(encodeUrlText('中文 & value', 'component')).toBe('%E4%B8%AD%E6%96%87%20%26%20value');
  });

  it('decodes a URL component', () => {
    expect(decodeUrlText('%E4%B8%AD%E6%96%87%20a', 'component')).toBe('中文 a');
  });

  it('parses URL properties and repeated query parameters', () => {
    const result = parseUrl('https://example.com/a?q=%E4%B8%AD%E6%96%87&q=2#part');
    expect(result.host).toBe('example.com');
    expect(result.parameters).toEqual([
      { key: 'q', value: '中文' },
      { key: 'q', value: '2' },
    ]);
  });

  it('formats bare query parameters', () => {
    expect(formatQueryParameters('a=1&name=%E4%B8%AD%E6%96%87')).toEqual([
      { key: 'a', value: '1' },
      { key: 'name', value: '中文' },
    ]);
  });
});
