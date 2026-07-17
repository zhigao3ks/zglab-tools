export type QrContentType = 'text' | 'url' | 'email' | 'phone' | 'wifi';
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';
export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface WifiPayload {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}

export interface QrPayloadInput {
  type: QrContentType;
  value: string;
  wifi?: WifiPayload;
}

export interface QrSettings {
  size: number;
  margin: number;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  foreground: string;
  background: string;
  transparentBackground: boolean;
}
