'use client';

import { Autocomplete, TextField } from '@mui/material';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '@/shared/components/Texts';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_STYLES, APP_INPUT_BASE_FONT_SIZE } from '@/shared/constants';

export interface FormAutocompleteInputProps<
  TFieldValues extends FieldValues,
  TOption,
> {
  id: string;
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  options: TOption[];
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  placeholder?: string;
}

export const FormAutocompleteInput = <
  TFieldValues extends FieldValues,
  TOption,
>({
  id,
  name,
  control,
  label,
  options,
  getOptionLabel,
  getOptionValue,
  placeholder,
}: FormAutocompleteInputProps<TFieldValues, TOption>) => {
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Autocomplete
            id={id}
            options={options}
            getOptionLabel={getOptionLabel}
            value={
              options.find(
                (option) => getOptionValue(option) === field.value,
              ) ?? null
            }
            onChange={(_event, newValue) =>
              field.onChange(newValue ? getOptionValue(newValue) : '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={placeholder}
                variant="outlined"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={[
                  APP_INPUT_STYLES.textField,
                  { '& .MuiOutlinedInput-input': { fontSize } },
                ]}
              />
            )}
          />
        )}
      />
    </div>
  );
};
