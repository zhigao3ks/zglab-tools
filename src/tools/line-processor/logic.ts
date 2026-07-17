import type { LineOrder, LineProcessorOptions, LineProcessorResult } from './types';

export const DEFAULT_LINE_OPTIONS: LineProcessorOptions = {
  trimLines: true,
  emptyLineMode: 'remove',
  dedupeMode: 'first',
  caseSensitive: true,
  normalizeForDedupe: true,
  order: 'keep',
};

export const normalizeLineBreaks = (input: string): string => input.replace(/\r\n?/g, '\n');

const applyEmptyLineMode = (
  lines: string[],
  mode: LineProcessorOptions['emptyLineMode'],
): { lines: string[]; removed: number } => {
  if (mode === 'preserve') return { lines, removed: 0 };

  if (mode === 'remove') {
    const kept = lines.filter((line) => line !== '');
    return { lines: kept, removed: lines.length - kept.length };
  }

  const kept: string[] = [];
  let previousWasEmpty = false;
  let removed = 0;
  for (const line of lines) {
    const isEmpty = line === '';
    if (isEmpty && previousWasEmpty) {
      removed += 1;
      continue;
    }
    kept.push(line);
    previousWasEmpty = isEmpty;
  }
  return { lines: kept, removed };
};

const createDedupeKey = (
  line: string,
  options: Pick<LineProcessorOptions, 'caseSensitive' | 'normalizeForDedupe'>,
): string => {
  const normalized = options.normalizeForDedupe ? line.normalize('NFKC') : line;
  return options.caseSensitive ? normalized : normalized.toLocaleLowerCase();
};

const deduplicate = (
  lines: string[],
  options: LineProcessorOptions,
): { lines: string[]; removed: number } => {
  if (options.dedupeMode === 'none') return { lines, removed: 0 };

  if (options.dedupeMode === 'first') {
    const seen = new Set<string>();
    const kept = lines.filter((line) => {
      const key = createDedupeKey(line, options);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { lines: kept, removed: lines.length - kept.length };
  }

  const lastIndexes = new Map<string, number>();
  lines.forEach((line, index) => lastIndexes.set(createDedupeKey(line, options), index));
  const kept = lines.filter(
    (line, index) => lastIndexes.get(createDedupeKey(line, options)) === index,
  );
  return { lines: kept, removed: lines.length - kept.length };
};

const numericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

const toFiniteLineNumber = (line: string): number | null => {
  const value = line.trim();
  if (!numericPattern.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const fisherYatesShuffle = (
  input: string[],
  random: () => number = Math.random,
): string[] => {
  const output = [...input];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
};

const orderLines = (
  lines: string[],
  order: LineOrder,
  caseSensitive: boolean,
  random: () => number,
): string[] => {
  if (order === 'keep') return lines;
  if (order === 'reverse') return [...lines].reverse();
  if (order === 'random') return fisherYatesShuffle(lines, random);

  const sensitivity = caseSensitive ? 'variant' : 'base';
  const collator = new Intl.Collator('zh-CN', { sensitivity, numeric: order === 'natural' });
  const output = [...lines];

  if (order === 'numeric') {
    output.sort((left, right) => {
      const leftNumber = toFiniteLineNumber(left);
      const rightNumber = toFiniteLineNumber(right);
      if (leftNumber !== null && rightNumber !== null) return leftNumber - rightNumber;
      if (leftNumber !== null) return -1;
      if (rightNumber !== null) return 1;
      return collator.compare(left, right);
    });
    return output;
  }

  output.sort((left, right) => collator.compare(left, right));
  return order === 'desc' ? output.reverse() : output;
};

export const processLines = (
  input: string,
  options: LineProcessorOptions = DEFAULT_LINE_OPTIONS,
  random: () => number = Math.random,
): LineProcessorResult => {
  const normalized = normalizeLineBreaks(input);
  const initialLines = input === '' ? [] : normalized.split('\n');
  const trimmedLines = options.trimLines ? initialLines.map((line) => line.trim()) : initialLines;
  const emptyResult = applyEmptyLineMode(trimmedLines, options.emptyLineMode);
  const dedupeResult = deduplicate(emptyResult.lines, options);
  const lines = orderLines(dedupeResult.lines, options.order, options.caseSensitive, random);
  const output = lines.join('\n');

  return {
    output,
    lines,
    stats: {
      inputLines: initialLines.length,
      outputLines: lines.length,
      duplicateLinesRemoved: dedupeResult.removed,
      emptyLinesRemoved: emptyResult.removed,
      inputCharacters: input.length,
      outputCharacters: output.length,
    },
  };
};
