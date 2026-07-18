'use client';

import { Typography, TypographyProps } from '@mui/material';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_TEXT_STYLES, APP_TEXT_BASE_FONT_SIZE } from '@/shared/constants';

export interface TitleProps extends TypographyProps {
  baseFontSize?: number;
}

export const Title = ({
  children,
  sx,
  component = 'h1',
  baseFontSize = APP_TEXT_BASE_FONT_SIZE.title,
  ...rest
}: TitleProps) => {
  const fontSize = useAccessibleFontSize(baseFontSize);

  return (
    <Typography
      component={component}
      sx={[APP_TEXT_STYLES.title, { fontSize }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    >
      {children}
    </Typography>
  );
};
