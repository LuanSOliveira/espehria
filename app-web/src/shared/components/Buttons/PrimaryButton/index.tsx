'use client';

import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_BUTTON_STYLES, APP_BUTTON_BASE_FONT_SIZE } from '@/shared/constants';

export interface PrimaryButtonProps extends ButtonProps {
  isLoading?: boolean;
}

export const PrimaryButton = ({
  children,
  sx,
  isLoading = false,
  disabled,
  ...rest
}: PrimaryButtonProps) => {
  const fontSize = useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.primary);

  return (
    <Button
      variant="contained"
      disableElevation
      disabled={disabled || isLoading}
      sx={[
        APP_BUTTON_STYLES.primary,
        { fontSize },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    >
      {isLoading ? <CircularProgress size={20} color="inherit" /> : children}
    </Button>
  );
};
