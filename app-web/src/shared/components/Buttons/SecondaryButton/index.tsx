'use client';

import { ReactNode } from 'react';
import { Button, ButtonProps } from '@mui/material';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_BUTTON_STYLES, APP_BUTTON_BASE_FONT_SIZE } from '@/shared/constants';

export interface SecondaryButtonProps extends ButtonProps {
  icon?: ReactNode;
}

export const SecondaryButton = ({
  children,
  sx,
  icon,
  startIcon,
  ...rest
}: SecondaryButtonProps) => {
  const fontSize = useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.secondary);

  return (
    <Button
      variant="outlined"
      disableElevation
      startIcon={icon ?? startIcon}
      sx={[
        APP_BUTTON_STYLES.secondary,
        { fontSize },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    >
      {children}
    </Button>
  );
};
