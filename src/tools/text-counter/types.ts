export interface ReadingSpeeds {
  chineseCharactersPerMinute: number;
  englishWordsPerMinute: number;
}

export interface TextStatistics {
  characterCount: number;
  nonWhitespaceCharacterCount: number;
  chineseCharacterCount: number;
  englishLetterCount: number;
  digitCount: number;
  spaceCount: number;
  punctuationCount: number;
  lineCount: number;
  nonEmptyLineCount: number;
  paragraphCount: number;
  englishWordCount: number;
  utf8Bytes: number;
  chineseReadingMinutes: number;
  englishReadingMinutes: number;
  combinedReadingMinutes: number;
}
