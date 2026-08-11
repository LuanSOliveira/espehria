'use client';

import { Checkbox, FormControlLabel } from '@mui/material';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_INPUT_BASE_FONT_SIZE, APP_INPUT_STYLES } from '@/shared/constants';

export interface DefaultCheckboxInputProps {
  id: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const DefaultCheckboxInput = ({
  id,
  label,
  checked,
  onChange,
  disabled,
}: DefaultCheckboxInputProps) => {
  const fontSize = useAccessibleFontSize(APP_INPUT_BASE_FONT_SIZE.text);

  return (
    <div className="flex items-center">
      <FormControlLabel
        control={
          <Checkbox
            id={id}
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
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
    </div>
  );
};
