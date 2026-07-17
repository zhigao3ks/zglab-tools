export type ActionState = 'idle' | 'loading' | 'success' | 'error';

export interface FaqItem {
  question: string;
  answer: string;
}

export type ThemePreference = 'system' | 'dark' | 'light';
