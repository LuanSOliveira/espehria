'use client';

import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Checkbox, FormControlLabel } from '@mui/material';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_BASE_FONT_SIZE, APP_INPUT_STYLES } from '@/shared/constants';

export interface FormCheckboxInputProps<TFieldValues extends FieldValues> {
  id: string;
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  disabled?: boolean;
}

export const FormCheckboxInput = <TFieldValues extends FieldValues>({
  id,
  name,
  control,
  label,
  disabled,
}: FormCheckboxInputProps<TFieldValues>) => {
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);

  return (
    <div className="flex items-center">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                id={id}
                checked={!!field.value}
                onChange={(event) => field.onChange(event.target.checked)}
                disabled={disabled}
                sx={APP_INPUT_STYLES.checkbox}
              />
            }
            label={label}
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize,
                ...APP_INPUT_STYLES.checkboxLabel,
              },
            }}
          />
        )}
      />
    </div>
  );
};
