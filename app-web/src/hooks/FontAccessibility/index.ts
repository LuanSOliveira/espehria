'use client';

import { useFontAccessibilityStore } from '@/store';
import { getAccessibleFontSize } from '@/shared/util';

export const useAccessibleFontSize = (baseFontSizePx: number): number => {
  const fontSizeLevel = useFontAccessibilityStore(
    (state) => state.fontSizeLevel,
  );

  return getAccessibleFontSize(baseFontSizePx, fontSizeLevel);
};
