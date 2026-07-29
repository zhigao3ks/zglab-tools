export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

export interface ScreenRatio {
  width: number;
  height: number;
  ratio: string;
  decimal: number;
  orientation: '横向' | '纵向' | '正方形';
}
