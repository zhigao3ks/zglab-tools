import { describe, expect, it } from 'vitest';
import { parseInlineMarkdown, parseMarkdown } from './logic';

describe('Markdown logic', () => {
  it('parses core block elements', () => {
    expect(parseMarkdown('# Title\n\n- first\n- second\n\n```ts\nconst a = 1;\n```')).toEqual([
      { type: 'heading', level: 1, children: [{ type: 'text', value: 'Title' }] },
      {
        type: 'list',
        ordered: false,
        start: 1,
        items: [[{ type: 'text', value: 'first' }], [{ type: 'text', value: 'second' }]],
      },
      { type: 'code', language: 'ts', value: 'const a = 1;' },
    ]);
  });

  it('keeps raw HTML as text instead of executable markup', () => {
    expect(parseInlineMarkdown('<script>alert(1)</script>')).toEqual([
      { type: 'text', value: '<script>alert(1)</script>' },
    ]);
  });

  it('only permits safe link protocols', () => {
    expect(parseInlineMarkdown('[bad](javascript:alert(1))')).toEqual([
      { type: 'text', value: '[bad](javascript:alert(1))' },
    ]);
  });
});
