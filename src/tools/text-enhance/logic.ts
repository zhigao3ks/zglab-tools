import type { ExtractedContacts, HiddenCharacter, NamingMode, TextCaseMode } from './types';

const wordsFromText = (input: string): string[] =>
  input
    .replace(/([a-z\d])([A-Z])/gu, '$1 $2')
    .replace(/[_\-.\s]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.toLocaleLowerCase());

const capitalize = (input: string): string =>
  input ? `${input[0].toLocaleUpperCase()}${input.slice(1).toLocaleLowerCase()}` : '';

export const convertTextCase = (input: string, mode: TextCaseMode): string => {
  if (mode === 'lower') return input.toLocaleLowerCase();
  if (mode === 'upper') return input.toLocaleUpperCase();
  if (mode === 'title') return input.replace(/\S+/gu, capitalize);
  return input.replace(
    /(^|[.!?]\s+)([^\s])/gu,
    (_, start: string, character: string) => `${start}${character.toLocaleUpperCase()}`,
  );
};

export const convertNaming = (input: string, mode: NamingMode): string => {
  const words = wordsFromText(input);
  if (mode === 'camel') return `${words[0] ?? ''}${words.slice(1).map(capitalize).join('')}`;
  if (mode === 'pascal') return words.map(capitalize).join('');
  if (mode === 'snake') return words.join('_');
  if (mode === 'kebab') return words.join('-');
  if (mode === 'constant') return words.join('_').toLocaleUpperCase();
  return words.join('.');
};

export const cleanWhitespace = (
  input: string,
  options: { trimLines: boolean; collapseSpaces: boolean; blankLineLimit: number },
): string => {
  const limit = Math.max(0, Math.floor(options.blankLineLimit));
  const lines = input
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => {
      const spaces = options.collapseSpaces ? line.replace(/[\t \u3000]+/gu, ' ') : line;
      return options.trimLines ? spaces.trim() : spaces;
    });
  const output: string[] = [];
  let blankCount = 0;
  for (const line of lines) {
    if (line === '') {
      blankCount += 1;
      if (blankCount > limit) continue;
    } else blankCount = 0;
    output.push(line);
  }
  return output.join('\n');
};

export const replacePlainText = (
  input: string,
  search: string,
  replacement: string,
  options: { all: boolean; caseSensitive: boolean },
): string => {
  if (search === '') throw new Error('请输入要查找的文本。');
  if (options.caseSensitive)
    return options.all ? input.split(search).join(replacement) : input.replace(search, replacement);
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return input.replace(new RegExp(escaped, options.all ? 'gi' : 'i'), replacement);
};

export const generateRandomString = (
  length: number,
  alphabet: string,
  random: () => number = Math.random,
): string => {
  if (!Number.isInteger(length) || length < 1 || length > 10_000)
    throw new Error('长度必须是 1 到 10000 之间的整数。');
  if (alphabet.length === 0) throw new Error('请至少选择一种字符类型。');
  return Array.from({ length }, () => alphabet[Math.floor(random() * alphabet.length)]).join('');
};

const loremWords =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(
    ' ',
  );

export const generateLoremIpsum = (paragraphs: number, wordsPerParagraph: number): string => {
  const count = Math.max(1, Math.min(100, Math.floor(paragraphs)));
  const words = Math.max(1, Math.min(500, Math.floor(wordsPerParagraph)));
  return Array.from({ length: count }, (_, paragraph) => {
    const sentence = Array.from(
      { length: words },
      (_, index) => loremWords[(paragraph * words + index) % loremWords.length],
    ).join(' ');
    return `${capitalize(sentence)}.`;
  }).join('\n\n');
};

const unique = (values: string[]): string[] => [...new Set(values)];

export const extractContacts = (input: string): ExtractedContacts => ({
  urls: unique(input.match(/https?:\/\/[^\s<>"']+/giu) ?? []),
  emails: unique(input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu) ?? []),
  phones: unique(input.match(/(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)/gu) ?? []),
});

const hiddenLabels: Record<string, string> = {
  '\u00a0': '不换行空格',
  '\u200b': '零宽空格',
  '\u200c': '零宽非连接符',
  '\u200d': '零宽连接符',
  '\u200e': '从左到右标记',
  '\u200f': '从右到左标记',
  '\ufeff': '零宽不换行空格 / BOM',
};

export const detectHiddenCharacters = (input: string): HiddenCharacter[] => {
  const found: HiddenCharacter[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const label =
      hiddenLabels[character] ??
      (character === '\t' ? '制表符' : character === '\r' ? '回车符' : null);
    if (label) {
      found.push({
        index,
        label,
        codePoint: `U+${character.codePointAt(0)?.toString(16).toLocaleUpperCase().padStart(4, '0')}`,
        visible: character === '\t' ? '⇥' : character === '\r' ? '␍' : '␣',
      });
    }
  }
  return found;
};
