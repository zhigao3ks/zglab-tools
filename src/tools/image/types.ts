export type ImageOutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageCrop extends ImageDimensions {
  left: number;
  top: number;
}
