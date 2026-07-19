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
}

export const DefaultAutocompleteInput = <TOption,>({
  id,
  label,
  options,
  getOptionLabel,
  value,
  onChange,
  placeholder,
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
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            variant="outlined"
            sx={[
              APP_INPUT_STYLES.textField,
              { '& .MuiOutlinedInput-input': { fontSize } },
            ]}
          />
        )}
      />
    </div>
  );
};
