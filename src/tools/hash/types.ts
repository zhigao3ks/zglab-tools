export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

export interface HashResult {
  algorithm: HashAlgorithm;
  value: string;
}
