export type Base64Operation = 'encode' | 'decode';

export interface Base64DecodedText {
  text: string;
  bytes: Uint8Array;
}
