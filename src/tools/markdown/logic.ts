import type { MarkdownBlock, MarkdownInline } from './types';

const appendText = (tokens: MarkdownInline[], value: string): void => {
  if (value === '') return;
  const previous = tokens.at(-1);
  if (previous?.type === 'text') previous.value += value;
  else tokens.push({ type: 'text', value });
};

const safeHref = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return trimmed;
  try {
    const url = new URL(trimmed);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export const parseInlineMarkdown = (input: string): MarkdownInline[] => {
  const tokens: MarkdownInline[] = [];
  let index = 0;
  while (index < input.length) {
    const remaining = input.slice(index);
    const code = remaining.match(/^`([^`]+)`/u);
    if (code) {
      tokens.push({ type: 'code', value: code[1] });
      index += code[0].length;
      continue;
    }
    const strong = remaining.match(/^(\*\*|__)(.+?)\1/u);
    if (strong) {
      tokens.push({ type: 'strong', children: parseInlineMarkdown(strong[2]) });
      index += strong[0].length;
      continue;
    }
    const emphasis = remaining.match(/^(\*|_)([^*_].*?)\1/u);
    if (emphasis) {
      tokens.push({ type: 'emphasis', children: parseInlineMarkdown(emphasis[2]) });
      index += emphasis[0].length;
      continue;
    }
    const link = remaining.match(/^\[([^\]]+)\]\(([^\s)]+)\)/u);
    if (link) {
      const href = safeHref(link[2]);
      if (href) tokens.push({ type: 'link', href, children: parseInlineMarkdown(link[1]) });
      else appendText(tokens, link[0]);
      index += link[0].length;
      continue;
    }
    appendText(tokens, input[index]);
    index += 1;
  }
  return tokens;
};

const isBlockStart = (line: string): boolean =>
  /^(#{1,6}\s+|```|>\s?|[-+*]\s+|\d+\.\s+)/u.test(line) || /^([-*_])(?:\s*\1){2,}\s*$/u.test(line);

export const parseMarkdown = (input: string): MarkdownBlock[] => {
  const lines = input.replace(/\r\n?/gu, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === '') {
      index += 1;
      continue;
    }
    const fence = line.match(/^```([^`]*)$/u);
    if (fence) {
      const language = fence[1].trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/u.test(lines[index]))
        codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push({ type: 'code', language, value: codeLines.join('\n') });
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/u);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        children: parseInlineMarkdown(heading[2]),
      });
      index += 1;
      continue;
    }
    if (/^([-*_])(?:\s*\1){2,}\s*$/u.test(line)) {
      blocks.push({ type: 'rule' });
      index += 1;
      continue;
    }
    if (/^>\s?/u.test(line)) {
      const quoted: string[] = [];
      while (index < lines.length && /^>\s?/u.test(lines[index]))
        quoted.push(lines[index++].replace(/^>\s?/u, ''));
      blocks.push({ type: 'blockquote', children: parseInlineMarkdown(quoted.join('\n')) });
      continue;
    }
    const listMatch = line.match(/^([-+*])\s+(.+)$/u);
    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/u);
    if (listMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch);
      const start = orderedMatch ? Number(orderedMatch[1]) : 1;
      const expression = ordered ? /^(\d+)\.\s+(.+)$/u : /^[-+*]\s+(.+)$/u;
      const items: MarkdownInline[][] = [];
      while (index < lines.length) {
        const match = lines[index].match(expression);
        if (!match) break;
        items.push(parseInlineMarkdown(match[ordered ? 2 : 1]));
        index += 1;
      }
      blocks.push({ type: 'list', ordered, start, items });
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() !== '' && !isBlockStart(lines[index])) {
      paragraph.push(lines[index++]);
    }
    if (paragraph.length > 0)
      blocks.push({ type: 'paragraph', children: parseInlineMarkdown(paragraph.join('\n')) });
    else index += 1;
  }
  return blocks;
};
