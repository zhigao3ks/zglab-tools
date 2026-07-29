export type ReferenceStyle = 'gbt7714' | 'apa7' | 'bibtex';

export interface ReferenceFields {
  authors: string;
  title: string;
  container: string;
  year: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
}

export interface DoiValidation {
  valid: boolean;
  normalized: string;
  error: string | null;
}
