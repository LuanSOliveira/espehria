'use client';

import { ReactNode, useState } from 'react';
import { IconButton, InputAdornment, TextField, TextFieldProps } from '@mui/material';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_STYLES, APP_INPUT_BASE_FONT_SIZE } from '@/shared/constants';

export interface DefaultPasswordInputProps
  extends Omit<TextFieldProps, 'variant' | 'type'> {
  icon?: ReactNode;
}

export const DefaultPasswordInput = ({
  icon,
  sx,
  slotProps,
  ...rest
}: DefaultPasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);
  const iconFontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.icon);

  return (
    <TextField
      variant="outlined"
      fullWidth
      type={isVisible ? 'text' : 'password'}
      sx={[
        APP_INPUT_STYLES.textField,
        { '& .MuiOutlinedInput-input': { fontSize } },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      slotProps={{
        ...slotProps,
        input: {
          startAdornment: icon ? (
            <InputAdornment
              position="start"
              sx={[APP_INPUT_STYLES.startIcon, { fontSize: iconFontSize }]}
            >
              {icon}
            </InputAdornment>
          ) : undefined,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={isVisible ? 'Ocultar senha' : 'Exibir senha'}
                onClick={() => setIsVisible((current) => !current)}
                edge="end"
                sx={[
                  APP_INPUT_STYLES.visibilityToggle,
                  { fontSize: iconFontSize },
                ]}
              >
                {isVisible ? <FiEyeOff /> : <FiEye />}
              </IconButton>
            </InputAdornment>
          ),
          ...slotProps?.input,
        },
      }}
      {...rest}
    />
  );
};
