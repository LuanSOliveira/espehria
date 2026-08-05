'use client';

import { Autocomplete, TextField } from '@mui/material';
import { Label } from '@/shared/components/Texts';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_STYLES, APP_INPUT_BASE_FONT_SIZE } from '@/shared/constants';

export interface DefaultAutocompleteInputProps<TOption> {
  id: string;
  label?: string;
  options: TOption[];
  getOptionLabel: (option: TOption) => string;
  value: TOption | null;
  onChange: (value: TOption | null) => void;
  placeholder?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  disabled?: boolean;
}

export const DefaultAutocompleteInput = <TOption,>({
  id,
  label,
  options,
  getOptionLabel,
  value,
  onChange,
  placeholder,
  inputValue,
  onInputChange,
  disabled,
}: DefaultAutocompleteInputProps<TOption>) => {
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Autocomplete
        id={id}
        options={options}
        getOptionLabel={getOptionLabel}
        value={value}
        onChange={(_event, newValue) => onChange(newValue)}
        disabled={disabled}
        inputValue={inputValue}
        onInputChange={
          onInputChange
            ? (_event, newInputValue) => onInputChange(newInputValue)
            : undefined
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
