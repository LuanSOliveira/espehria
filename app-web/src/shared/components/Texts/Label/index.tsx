'use client';

import { Typography, TypographyProps } from '@mui/material';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_TEXT_STYLES, APP_TEXT_BASE_FONT_SIZE } from '@/shared/constants';

export interface LabelProps extends TypographyProps {
  baseFontSize?: number;
  htmlFor?: string;
}

export const Label = ({
  children,
  sx,
  component = 'label',
  baseFontSize = APP_TEXT_BASE_FONT_SIZE.label,
  htmlFor,
  ...rest
}: LabelProps) => {
  const fontSize = useAccessibleFontSize(baseFontSize);

  return (
    <Typography
      component={component}
      htmlFor={htmlFor}
      sx={[APP_TEXT_STYLES.label, { fontSize }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    >
      {children}
    </Typography>
  );
};
