'use client';

import { ReactNode, useState } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
} from '@mui/material';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_STYLES, APP_INPUT_BASE_FONT_SIZE } from '@/shared/constants';

export interface FormPasswordInputProps<TFieldValues extends FieldValues>
  extends Omit<TextFieldProps, 'name' | 'variant' | 'defaultValue' | 'type'> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  icon?: ReactNode;
}

export const FormPasswordInput = <TFieldValues extends FieldValues>({
  name,
  control,
  icon,
  sx,
  slotProps,
  ...rest
}: FormPasswordInputProps<TFieldValues>) => {
  const [isVisible, setIsVisible] = useState(false);
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
          type={isVisible ? 'text' : 'password'}
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
      )}
    />
  );
};
