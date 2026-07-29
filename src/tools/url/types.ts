export type UrlEncodingMode = 'component' | 'uri';

export interface UrlParameter {
  key: string;
  value: string;
}

export interface ParsedUrl {
  href: string;
  origin: string;
  protocol: string;
  host: string;
  pathname: string;
  hash: string;
  parameters: UrlParameter[];
}
