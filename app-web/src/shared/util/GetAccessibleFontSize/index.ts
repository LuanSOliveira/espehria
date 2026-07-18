const FONT_STEP_PX = 2;
const MIN_FONT_SIZE_PX = 10;
const MAX_FONT_SIZE_PX = 96;

export const getAccessibleFontSize = (
  baseFontSizePx: number,
  fontSizeLevel: number,
): number => {
  const fontSize = baseFontSizePx + fontSizeLevel * FONT_STEP_PX;

  return Math.min(Math.max(fontSize, MIN_FONT_SIZE_PX), MAX_FONT_SIZE_PX);
};
