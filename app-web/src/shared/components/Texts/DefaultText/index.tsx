'use client';

import { Typography, TypographyProps } from '@mui/material';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_TEXT_STYLES, APP_TEXT_BASE_FONT_SIZE } from '@/shared/constants';

export interface DefaultTextProps extends TypographyProps {
  baseFontSize?: number;
}

export const DefaultText = ({
  children,
  sx,
  component = 'p',
  baseFontSize = APP_TEXT_BASE_FONT_SIZE.default,
  ...rest
}: DefaultTextProps) => {
  const fontSize = useAccessibleFontSize(baseFontSize);

  return (
    <Typography
      component={component}
      sx={[APP_TEXT_STYLES.default, { fontSize }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    >
      {children}
    </Typography>
  );
};
