import { describe, expect, it } from 'vitest';
import {
  cleanWhitespace,
  convertNaming,
  convertTextCase,
  detectHiddenCharacters,
  extractContacts,
  replacePlainText,
} from './logic';

describe('text enhancement logic', () => {
  it('converts cases and common naming conventions', () => {
    expect(convertTextCase('zglab tools', 'title')).toBe('Zglab Tools');
    expect(convertNaming('ZGLab tools API', 'camel')).toBe('zglabToolsApi');
    expect(convertNaming('ZGLab tools API', 'snake')).toBe('zglab_tools_api');
  });

  it('cleans whitespace and replaces literal text', () => {
    expect(
      cleanWhitespace('  a   b  \n\n\n c ', {
        trimLines: true,
        collapseSpaces: true,
        blankLineLimit: 1,
      }),
    ).toBe('a b\n\nc');
    expect(
      replacePlainText('ZGLab zglab', 'zglab', 'Tools', { all: true, caseSensitive: false }),
    ).toBe('Tools Tools');
  });

  it('extracts contacts and finds invisible characters', () => {
    expect(extractContacts('https://zglab.fun a@zglab.fun 13800138000').emails).toEqual([
      'a@zglab.fun',
    ]);
    expect(detectHiddenCharacters(`a\u200bb`)).toEqual([
      { index: 1, label: '零宽空格', codePoint: 'U+200B', visible: '␣' },
    ]);
  });
});
