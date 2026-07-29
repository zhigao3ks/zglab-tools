import type { ParsedUrl, UrlEncodingMode, UrlParameter } from './types';

export const encodeUrlText = (input: string, mode: UrlEncodingMode): string => {
  if (input === '') throw new Error('请输入要编码的内容。');
  return mode === 'component' ? encodeURIComponent(input) : encodeURI(input);
};

export const decodeUrlText = (input: string, mode: UrlEncodingMode): string => {
  if (input === '') throw new Error('请输入要解码的内容。');
  try {
    return mode === 'component' ? decodeURIComponent(input) : decodeURI(input);
  } catch {
    throw new Error('URL 编码不完整或包含无效的百分号转义。');
  }
};

export const parseUrl = (input: string): ParsedUrl => {
  if (input.trim() === '') throw new Error('请输入要解析的 URL。');
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error('请输入包含协议的有效 URL，例如 https://example.com/path?a=1。');
  }
  return {
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    host: url.host,
    pathname: url.pathname,
    hash: url.hash,
    parameters: [...url.searchParams.entries()].map(([key, value]) => ({ key, value })),
  };
};

export const formatQueryParameters = (input: string): UrlParameter[] => {
  const query = input.includes('?') ? input.slice(input.indexOf('?') + 1).split('#')[0] : input;
  return [...new URLSearchParams(query).entries()].map(([key, value]) => ({ key, value }));
};

export const stringifyQueryParameters = (parameters: UrlParameter[]): string =>
  new URLSearchParams(parameters.map(({ key, value }) => [key, value])).toString();
