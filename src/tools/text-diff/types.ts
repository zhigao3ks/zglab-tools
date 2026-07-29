export type DiffKind = 'same' | 'added' | 'removed';

export interface DiffSegment {
  kind: DiffKind;
  value: string;
}

export interface TextDiffResult {
  left: DiffSegment[];
  right: DiffSegment[];
  addedCharacters: number;
  removedCharacters: number;
  unchangedCharacters: number;
  coarse: boolean;
}
