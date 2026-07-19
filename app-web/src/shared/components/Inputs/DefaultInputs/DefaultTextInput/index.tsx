'use client';

import { ReactNode } from 'react';
import { InputAdornment, TextField, TextFieldProps } from '@mui/material';
import { Label } from '@/shared/components/Texts';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_STYLES, APP_INPUT_BASE_FONT_SIZE } from '@/shared/constants';

export interface DefaultTextInputProps
  extends Omit<TextFieldProps, 'variant' | 'label'> {
  icon?: ReactNode;
  label?: ReactNode;
}

export const DefaultTextInput = ({
  icon,
  label,
  id,
  sx,
  slotProps,
  ...rest
}: DefaultTextInputProps) => {
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);
  const iconFontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.icon);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <TextField
        id={id}
        variant="outlined"
        fullWidth
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
            ...slotProps?.input,
          },
        }}
        {...rest}
      />
    </div>
  );
};
