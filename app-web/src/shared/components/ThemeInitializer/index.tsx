'use client';

import { useThemeStore } from '@/store';
import { useEffect } from 'react';

export default function ThemeInitializer() {
  const theme = useThemeStore((state) => state.theme);

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}
