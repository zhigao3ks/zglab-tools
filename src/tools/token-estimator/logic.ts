import type { TokenEstimate } from './types';

const count = (input: string, expression: RegExp): number => input.match(expression)?.length ?? 0;

export const estimateTokens = (input: string): TokenEstimate => {
  const hanCharacters = count(input, /\p{Script=Han}/gu);
  const latinCharacters = count(input, /\p{Script=Latin}/gu);
  const characters = Array.from(input).length;
  const numbersAndSymbols = Math.max(
    0,
    characters - hanCharacters - latinCharacters - count(input, /\s/gu),
  );
  const nonHan = Math.max(0, characters - hanCharacters);
  return {
    characters,
    hanCharacters,
    latinCharacters,
    numbersAndSymbols,
    lines: input === '' ? 0 : input.replace(/\r\n?/gu, '\n').split('\n').length,
    estimates: {
      balanced: Math.max(0, Math.round(hanCharacters * 1.35 + nonHan / 4)),
      chineseHeavy: Math.max(0, Math.round(hanCharacters * 1.7 + nonHan / 4.5)),
      englishOrCode: Math.max(0, Math.round(hanCharacters * 1.05 + nonHan / 3.2)),
    },
  };
};
