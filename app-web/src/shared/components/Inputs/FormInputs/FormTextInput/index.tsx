'use client';

import { ReactNode } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { InputAdornment, TextField, TextFieldProps } from '@mui/material';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_STYLES, APP_INPUT_BASE_FONT_SIZE } from '@/shared/constants';

export interface FormTextInputProps<TFieldValues extends FieldValues>
  extends Omit<TextFieldProps, 'name' | 'variant' | 'defaultValue'> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  icon?: ReactNode;
}

export const FormTextInput = <TFieldValues extends FieldValues>({
  name,
  control,
  icon,
  sx,
  slotProps,
  ...rest
}: FormTextInputProps<TFieldValues>) => {
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);
  const iconFontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.icon);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          variant="outlined"
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
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
      )}
    />
  );
};
