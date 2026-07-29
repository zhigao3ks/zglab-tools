export interface TokenEstimate {
  characters: number;
  hanCharacters: number;
  latinCharacters: number;
  numbersAndSymbols: number;
  lines: number;
  estimates: {
    balanced: number;
    chineseHeavy: number;
    englishOrCode: number;
  };
}
