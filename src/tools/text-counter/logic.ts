import type { ReadingSpeeds, TextStatistics } from './types';

export const DEFAULT_READING_SPEEDS: ReadingSpeeds = {
  chineseCharactersPerMinute: 400,
  englishWordsPerMinute: 225,
};

const visibleCharacters = (input: string): string[] => {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' });
    return [...segmenter.segment(input)].map((segment) => segment.segment);
  }
  return Array.from(input);
};

const countMatches = (input: string, expression: RegExp): number =>
  input.match(expression)?.length ?? 0;

const countEnglishWords = (input: string): number =>
  input.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length ?? 0;

const countParagraphs = (input: string): number => {
  const normalized = input.replace(/\r\n?/g, '\n').trim();
  if (normalized === '') return 0;
  return normalized.split(/\n[ \t\u3000]*\n+/).filter((paragraph) => paragraph.trim() !== '')
    .length;
};

export const countText = (
  input: string,
  speeds: ReadingSpeeds = DEFAULT_READING_SPEEDS,
): TextStatistics => {
  const normalized = input.replace(/\r\n?/g, '\n');
  const characters = visibleCharacters(input);
  const lines = input === '' ? [] : normalized.split('\n');
  const chineseCharacterCount = countMatches(input, /\p{Script=Han}/gu);
  const englishWordCount = countEnglishWords(input);
  const chineseReadingMinutes =
    speeds.chineseCharactersPerMinute > 0
      ? chineseCharacterCount / speeds.chineseCharactersPerMinute
      : 0;
  const englishReadingMinutes =
    speeds.englishWordsPerMinute > 0 ? englishWordCount / speeds.englishWordsPerMinute : 0;

  return {
    characterCount: characters.length,
    nonWhitespaceCharacterCount: characters.filter((character) => !/^\s+$/u.test(character)).length,
    chineseCharacterCount,
    englishLetterCount: countMatches(input, /\p{Script=Latin}/gu),
    digitCount: countMatches(input, /\p{Number}/gu),
    spaceCount: countMatches(input, /[ \t\u3000]/gu),
    punctuationCount: countMatches(input, /\p{Punctuation}/gu),
    lineCount: lines.length,
    nonEmptyLineCount: lines.filter((line) => line.trim() !== '').length,
    paragraphCount: countParagraphs(input),
    englishWordCount,
    utf8Bytes: new TextEncoder().encode(input).byteLength,
    chineseReadingMinutes,
    englishReadingMinutes,
    combinedReadingMinutes: chineseReadingMinutes + englishReadingMinutes,
  };
};

const formatMinutes = (minutes: number): string =>
  minutes === 0 ? '0 分钟' : `${Math.max(0.1, minutes).toFixed(1)} 分钟`;

export const createStatisticsReport = (statistics: TextStatistics): string =>
  [
    'ZGLab Tools · 文本统计报告',
    '',
    `总字符数：${statistics.characterCount}`,
    `不含空白字符：${statistics.nonWhitespaceCharacterCount}`,
    `中文字符：${statistics.chineseCharacterCount}`,
    `英文字母：${statistics.englishLetterCount}`,
    `英文单词：${statistics.englishWordCount}`,
    `数字：${statistics.digitCount}`,
    `空格与制表符：${statistics.spaceCount}`,
    `标点符号：${statistics.punctuationCount}`,
    `行数：${statistics.lineCount}`,
    `非空行：${statistics.nonEmptyLineCount}`,
    `段落：${statistics.paragraphCount}`,
    `UTF-8 字节：${statistics.utf8Bytes}`,
    `中文阅读时间：${formatMinutes(statistics.chineseReadingMinutes)}`,
    `英文阅读时间：${formatMinutes(statistics.englishReadingMinutes)}`,
    `综合阅读时间：${formatMinutes(statistics.combinedReadingMinutes)}`,
    '',
  ].join('\n');
