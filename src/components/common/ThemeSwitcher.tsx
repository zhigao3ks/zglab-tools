import { useEffect, useState } from 'preact/hooks';
import type { ThemePreference } from '../../types/common';
import { getThemePreference, setThemePreference } from '../../utils/storage';

const preferences: ThemePreference[] = ['system', 'dark', 'light'];
const labels: Record<ThemePreference, string> = {
  system: '跟随系统',
  dark: '深色',
  light: '浅色',
};

export function ThemeSwitcher() {
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => setPreference(getThemePreference()), []);

  const cycleTheme = () => {
    const next = preferences[(preferences.indexOf(preference) + 1) % preferences.length];
    setPreference(next);
    setThemePreference(next);
  };

  return (
    <button
      class="theme-switcher"
      type="button"
      onClick={cycleTheme}
      title={`当前主题：${labels[preference]}。点击切换。`}
      aria-label={`当前主题：${labels[preference]}。点击切换主题。`}
    >
      <span class="theme-switcher-icon" aria-hidden="true">
        ◐
      </span>
      <span>{labels[preference]}</span>
    </button>
  );
}
