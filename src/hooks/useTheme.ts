'use client';
import { useEffect } from 'react';
import { useUIStore } from '@/store';
import { getThemeConfig, applyThemeToCSSVars } from '@/lib/theme';

export function useTheme() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      const newTheme = getThemeConfig(hour);
      setTheme(newTheme);
      applyThemeToCSSVars(newTheme);
    };

    updateTheme();

    // Check every minute if theme needs to change
    const interval = setInterval(updateTheme, 60_000);
    return () => clearInterval(interval);
  }, [setTheme]);

  return theme;
}
