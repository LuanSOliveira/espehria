'use client';

import { useThemeStore } from '@/store';
import { useEffect, useState } from 'react';

export default function ThemeInitializer() {
  const theme = useThemeStore((state) => state.theme);
  const [mounted, setMounted] = useState(false);

  // Apply theme on mount and when it changes
  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Prevent rendering content until mounted (after hydration)
  if (!mounted) {
    return null;
  }

  return null;
}
