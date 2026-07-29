export type JwtExpirationStatus = 'valid' | 'expired' | 'not-set';

export interface ParsedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  expiration: {
    status: JwtExpirationStatus;
    iso: string | null;
    relativeMilliseconds: number | null;
  };
}
