const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const LUMINANCE_THRESHOLD = 0.6;

const expandShorthandHex = (hex: string): string =>
  hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;

export const getContrastTextColor = (backgroundColor: string): string => {
  if (!HEX_COLOR_PATTERN.test(backgroundColor)) {
    return '#ffffff';
  }

  const hex = expandShorthandHex(backgroundColor);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const relativeLuminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return relativeLuminance > LUMINANCE_THRESHOLD ? '#000000' : '#ffffff';
};
