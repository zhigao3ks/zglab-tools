import type { DiffKind, DiffSegment, TextDiffResult } from './types';

const MAX_DIFF_CELLS = 600_000;

const segmentText = (input: string): string[] => {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' });
    return [...segmenter.segment(input)].map((item) => item.segment);
  }
  return Array.from(input);
};

const segmentLines = (input: string): string[] =>
  input.match(/.*(?:\n|$)/gu)?.filter(Boolean) ?? [];

const append = (segments: DiffSegment[], kind: DiffKind, value: string): void => {
  if (value === '') return;
  const previous = segments.at(-1);
  if (previous?.kind === kind) previous.value += value;
  else segments.push({ kind, value });
};

const createDiff = (
  leftTokens: string[],
  rightTokens: string[],
): Omit<TextDiffResult, 'coarse'> => {
  const width = rightTokens.length + 1;
  const table = new Uint32Array((leftTokens.length + 1) * width);
  const cell = (row: number, column: number): number => row * width + column;

  for (let row = leftTokens.length - 1; row >= 0; row -= 1) {
    for (let column = rightTokens.length - 1; column >= 0; column -= 1) {
      table[cell(row, column)] =
        leftTokens[row] === rightTokens[column]
          ? table[cell(row + 1, column + 1)] + 1
          : Math.max(table[cell(row + 1, column)], table[cell(row, column + 1)]);
    }
  }

  const left: DiffSegment[] = [];
  const right: DiffSegment[] = [];
  let row = 0;
  let column = 0;
  let addedCharacters = 0;
  let removedCharacters = 0;
  let unchangedCharacters = 0;

  while (row < leftTokens.length || column < rightTokens.length) {
    if (
      row < leftTokens.length &&
      column < rightTokens.length &&
      leftTokens[row] === rightTokens[column]
    ) {
      append(left, 'same', leftTokens[row]);
      append(right, 'same', rightTokens[column]);
      unchangedCharacters += leftTokens[row].length;
      row += 1;
      column += 1;
    } else if (
      column < rightTokens.length &&
      (row === leftTokens.length || table[cell(row, column + 1)] >= table[cell(row + 1, column)])
    ) {
      append(right, 'added', rightTokens[column]);
      addedCharacters += rightTokens[column].length;
      column += 1;
    } else if (row < leftTokens.length) {
      append(left, 'removed', leftTokens[row]);
      removedCharacters += leftTokens[row].length;
      row += 1;
    }
  }

  return { left, right, addedCharacters, removedCharacters, unchangedCharacters };
};

export const compareText = (leftInput: string, rightInput: string): TextDiffResult => {
  const leftTokens = segmentText(leftInput);
  const rightTokens = segmentText(rightInput);
  if (leftTokens.length * rightTokens.length <= MAX_DIFF_CELLS) {
    return { ...createDiff(leftTokens, rightTokens), coarse: false };
  }

  const leftLines = segmentLines(leftInput);
  const rightLines = segmentLines(rightInput);
  if (leftLines.length * rightLines.length <= MAX_DIFF_CELLS) {
    return { ...createDiff(leftLines, rightLines), coarse: true };
  }

  return {
    left: leftInput ? [{ kind: 'removed', value: leftInput }] : [],
    right: rightInput ? [{ kind: 'added', value: rightInput }] : [],
    addedCharacters: rightInput.length,
    removedCharacters: leftInput.length,
    unchangedCharacters: 0,
    coarse: true,
  };
};
