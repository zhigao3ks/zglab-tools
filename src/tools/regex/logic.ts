import type { RegexMatch, RegexResult } from './types';

const supportedFlags = new Set(['d', 'g', 'i', 'm', 's', 'u', 'v', 'y']);

export const validateRegexFlags = (flags: string): string => {
  const unique = new Set<string>();
  for (const flag of flags) {
    if (!supportedFlags.has(flag) || unique.has(flag)) throw new Error('正则标志无效或重复。');
    unique.add(flag);
  }
  if (unique.has('u') && unique.has('v')) throw new Error('u 与 v 标志不能同时使用。');
  return flags;
};

const createGlobalRegex = (pattern: string, flags: string): RegExp => {
  const validatedFlags = validateRegexFlags(flags);
  return new RegExp(pattern, validatedFlags.includes('g') ? validatedFlags : `${validatedFlags}g`);
};

export const findRegexMatches = (pattern: string, flags: string, input: string): RegexMatch[] => {
  if (pattern === '') throw new Error('请输入正则表达式。');
  const expression = createGlobalRegex(pattern, flags);
  const matches: RegexMatch[] = [];
  for (const match of input.matchAll(expression)) {
    matches.push({
      index: match.index,
      value: match[0],
      groups: match.slice(1),
      namedGroups: match.groups ? { ...match.groups } : {},
    });
  }
  return matches;
};

export const replaceByRegex = (
  pattern: string,
  flags: string,
  input: string,
  replacement: string,
): string => input.replace(createGlobalRegex(pattern, flags), replacement);

export const runRegex = (
  pattern: string,
  flags: string,
  input: string,
  replacement: string,
): RegexResult => ({
  matches: findRegexMatches(pattern, flags, input),
  replaced: replaceByRegex(pattern, flags, input, replacement),
});
