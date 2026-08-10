'use client';

import { Autocomplete, Chip, TextField } from '@mui/material';
import { Label } from '@/shared/components/Texts';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_STYLES, APP_INPUT_BASE_FONT_SIZE } from '@/shared/constants';
import { getContrastTextColor } from '@/shared/util';

export interface DefaultMultiAutocompleteInputProps<TOption> {
  id: string;
  label?: string;
  options: TOption[];
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  getOptionColor?: (option: TOption) => string;
  value: TOption[];
  onChange: (value: TOption[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DefaultMultiAutocompleteInput = <TOption,>({
  id,
  label,
  options,
  getOptionLabel,
  getOptionValue,
  getOptionColor,
  value,
  onChange,
  placeholder,
  disabled,
}: DefaultMultiAutocompleteInputProps<TOption>) => {
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Autocomplete
        multiple
        id={id}
        options={options}
        getOptionLabel={getOptionLabel}
        value={value}
        onChange={(_event, newValue) => onChange(newValue)}
        disabled={disabled}
        renderValue={(selectedValue, getItemProps) =>
          selectedValue.map((option, index) => {
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
            sx={[
              APP_INPUT_STYLES.textField,
              APP_INPUT_STYLES.autocompleteField,
              { '& .MuiOutlinedInput-input': { fontSize } },
            ]}
          />
        )}
      />
    </div>
  );
};
