export type TextCaseMode = 'lower' | 'upper' | 'title' | 'sentence';
export type NamingMode = 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant' | 'dot';

export interface HiddenCharacter {
  index: number;
  label: string;
  codePoint: string;
  visible: string;
}

export interface ExtractedContacts {
  urls: string[];
  emails: string[];
  phones: string[];
}
