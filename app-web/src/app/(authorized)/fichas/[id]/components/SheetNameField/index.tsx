'use client';

import { TextField } from '@mui/material';
import { APP_COLORS } from '@/shared/constants';

export interface SheetNameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const SheetNameField = ({ value, onChange }: SheetNameFieldProps) => {
  return (
    <TextField
      id="sheet-name-field"
      variant="standard"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Nome da ficha"
      slotProps={{ htmlInput: { 'aria-label': 'Nome da ficha' } }}
      sx={{
        '& .MuiInput-root:before': { borderBottom: 'none' },
        '& .MuiInput-root:hover:not(.Mui-disabled):before': {
          borderBottom: `1px solid ${APP_COLORS.goldDark}`,
        },
        '& .MuiInput-root:after': {
          borderBottom: `2px solid ${APP_COLORS.gold}`,
        },
        '& .MuiInputBase-input': {
          fontSize: '2rem',
          fontWeight: 700,
          color: APP_COLORS.textBrownDark,
        },
      }}
    />
  );
};
