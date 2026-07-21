'use client';

import { ReactNode } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { TextField, TextFieldProps } from '@mui/material';
import { Label } from '@/shared/components/Texts';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_STYLES, APP_INPUT_BASE_FONT_SIZE } from '@/shared/constants';

export interface FormColorInputProps<TFieldValues extends FieldValues>
  extends Omit<
    TextFieldProps,
    'name' | 'variant' | 'defaultValue' | 'type' | 'label'
  > {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label?: ReactNode;
}

export const FormColorInput = <TFieldValues extends FieldValues>({
  name,
  control,
  label,
  id,
  sx,
  slotProps,
  ...rest
}: FormColorInputProps<TFieldValues>) => {
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id={id}
            type="color"
            variant="outlined"
            fullWidth
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            sx={[
              APP_INPUT_STYLES.textField,
              {
                '& .MuiOutlinedInput-input': {
                  fontSize,
                  padding: '6px 8px',
                  height: '36px',
                  cursor: 'pointer',
                },
              },
              ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
            slotProps={slotProps}
            {...rest}
          />
        )}
      />
    </div>
  );
};
