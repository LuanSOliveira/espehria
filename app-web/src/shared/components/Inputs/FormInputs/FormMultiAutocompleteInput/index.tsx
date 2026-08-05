'use client';

import { Autocomplete, Chip, TextField } from '@mui/material';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '@/shared/components/Texts';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_STYLES, APP_INPUT_BASE_FONT_SIZE } from '@/shared/constants';
import { getContrastTextColor } from '@/shared/util';

export interface FormMultiAutocompleteInputProps<
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
  getOptionColor?: (option: TOption) => string;
  placeholder?: string;
}

export const FormMultiAutocompleteInput = <
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
  getOptionColor,
  placeholder,
}: FormMultiAutocompleteInputProps<TFieldValues, TOption>) => {
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Autocomplete
            multiple
            id={id}
            options={options}
            getOptionLabel={getOptionLabel}
            value={((field.value as string[] | undefined) ?? [])
              .map((selectedId) =>
                options.find((option) => getOptionValue(option) === selectedId),
              )
              .filter((option): option is TOption => option !== undefined)}
            onChange={(_event, newValue) =>
              field.onChange(newValue.map(getOptionValue))
            }
            renderValue={(value, getItemProps) =>
              value.map((option, index) => {
                const backgroundColor = getOptionColor?.(option);
                const { key, ...itemProps } = getItemProps({ index });

                return (
                  <Chip
                    key={key}
                    label={getOptionLabel(option)}
                    {...itemProps}
                    sx={
                      backgroundColor
                        ? {
                            backgroundColor,
                            color: getContrastTextColor(backgroundColor),
                            '& .MuiChip-deleteIcon': {
                              color: getContrastTextColor(backgroundColor),
                              opacity: 0.7,
                              '&:hover': { opacity: 1 },
                            },
                          }
                        : undefined
                    }
                  />
                );
              })
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
                  APP_INPUT_STYLES.autocompleteField,
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
