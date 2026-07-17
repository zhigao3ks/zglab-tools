export type EmptyLineMode = 'preserve' | 'remove' | 'merge';
export type DedupeMode = 'none' | 'first' | 'last';
export type LineOrder = 'keep' | 'asc' | 'desc' | 'natural' | 'numeric' | 'random' | 'reverse';

export interface LineProcessorOptions {
  trimLines: boolean;
  emptyLineMode: EmptyLineMode;
  dedupeMode: DedupeMode;
  caseSensitive: boolean;
  normalizeForDedupe: boolean;
  order: LineOrder;
}

export interface LineProcessorStats {
  inputLines: number;
  outputLines: number;
  duplicateLinesRemoved: number;
  emptyLinesRemoved: number;
  inputCharacters: number;
  outputCharacters: number;
}

export interface LineProcessorResult {
  output: string;
  lines: string[];
  stats: LineProcessorStats;
}
