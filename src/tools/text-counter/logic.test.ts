import { describe, expect, it } from 'vitest';
import { countText, createStatisticsReport } from './logic';

describe('countText', () => {
  it('returns zero values for empty text', () => {
    const result = countText('');
    expect(result.characterCount).toBe(0);
    expect(result.lineCount).toBe(0);
    expect(result.paragraphCount).toBe(0);
  });

  it('counts Chinese text', () => {
    const result = countText('你好，世界。');
    expect(result.chineseCharacterCount).toBe(4);
    expect(result.punctuationCount).toBe(2);
  });

  it('counts English letters and words', () => {
    const result = countText("ZGLab tools don't upload text.");
    expect(result.englishWordCount).toBe(5);
    expect(result.englishLetterCount).toBeGreaterThan(20);
  });

  it('counts mixed Chinese, English, numbers and punctuation', () => {
    const result = countText('版本 v2，共 5 tools!');
    expect(result.chineseCharacterCount).toBe(3);
    expect(result.englishWordCount).toBe(2);
    expect(result.digitCount).toBe(2);
    expect(result.punctuationCount).toBe(2);
  });

  it('counts an emoji as one visible grapheme', () => {
    expect(countText('😀').characterCount).toBe(1);
    expect(countText('👨‍👩‍👧‍👦').characterCount).toBe(1);
  });

  it('handles LF and CRLF consistently', () => {
    expect(countText('a\nb').lineCount).toBe(2);
    expect(countText('a\r\nb').lineCount).toBe(2);
  });

  it('counts paragraphs separated by multiple blank lines', () => {
    const result = countText('第一段\n\n\n第二段\n  \n第三段');
    expect(result.paragraphCount).toBe(3);
    expect(result.nonEmptyLineCount).toBe(3);
  });

  it('counts UTF-8 bytes', () => {
    expect(countText('a').utf8Bytes).toBe(1);
    expect(countText('中').utf8Bytes).toBe(3);
    expect(countText('😀').utf8Bytes).toBe(4);
  });

  it('uses configurable reading speeds', () => {
    const result = countText('中文 one two', {
      chineseCharactersPerMinute: 2,
      englishWordsPerMinute: 2,
    });
    expect(result.chineseReadingMinutes).toBe(1);
    expect(result.englishReadingMinutes).toBe(1);
    expect(result.combinedReadingMinutes).toBe(2);
  });

  it('creates a downloadable report', () => {
    const report = createStatisticsReport(countText('你好 hello'));
    expect(report).toContain('文本统计报告');
    expect(report).toContain('中文字符：2');
    expect(report).toContain('英文单词：1');
  });
});
