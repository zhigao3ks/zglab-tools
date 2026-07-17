import type { ThemePreference } from '../types/common';

const THEME_KEY = 'zglab-tools:theme';
const RECENT_TOOLS_KEY = 'zglab-tools:recent';

const canUseStorage = (): boolean => typeof window !== 'undefined' && 'localStorage' in window;

export const getThemePreference = (): ThemePreference => {
  if (!canUseStorage()) return 'system';
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : 'system';
  } catch {
    return 'system';
  }
};

export const setThemePreference = (preference: ThemePreference): void => {
  if (!canUseStorage()) return;
  try {
    if (preference === 'system') {
      window.localStorage.removeItem(THEME_KEY);
      document.documentElement.removeAttribute('data-theme');
      return;
    }
    window.localStorage.setItem(THEME_KEY, preference);
    document.documentElement.dataset.theme = preference;
  } catch {
    // Theme persistence is optional; the page remains usable.
  }
};

export const recordRecentTool = (toolId: string): void => {
  if (!canUseStorage()) return;
  try {
    const current = JSON.parse(window.localStorage.getItem(RECENT_TOOLS_KEY) ?? '[]') as unknown;
    const ids = Array.isArray(current)
      ? current.filter((item): item is string => typeof item === 'string')
      : [];
    const next = [toolId, ...ids.filter((id) => id !== toolId)].slice(0, 5);
    window.localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(next));
  } catch {
    // Recent tools are a non-essential preference.
  }
};
