'use client';

import { ChangeEvent } from 'react';
import { TextField } from '@mui/material';
import { Label } from '@/shared/components/Texts';

export interface SheetLevelFieldProps {
  value: number;
  onChange: (value: number) => void;
}

export const SheetLevelField = ({ value, onChange }: SheetLevelFieldProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;

    if (rawValue === '') {
      return;
    }

    const parsedValue = Number(rawValue);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      return;
    }

    onChange(parsedValue);
  };

  return (
    <div>
      <Label htmlFor="sheet-level-field">Nível</Label>
      <TextField
        id="sheet-level-field"
        variant="standard"
        type="number"
        fullWidth
        value={value}
        onChange={handleChange}
        slotProps={{ htmlInput: { min: 1, step: 1 } }}
      />
    </div>
  );
};
