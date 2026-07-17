export interface NormalizeOptions {
  trim: boolean;
  collapseSpaces: boolean;
}

export const normalizeText = (input: string, options: NormalizeOptions): string => {
  const trimmed = options.trim ? input.trim() : input;
  return options.collapseSpaces ? trimmed.replace(/\s+/gu, ' ') : trimmed;
};
