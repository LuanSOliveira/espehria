'use client';

import { ChangeEvent } from 'react';
import { TextField } from '@mui/material';
import { Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

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
    <div style={APP_CONTAINER_STYLES.detailSectionBox}>
      <div
        className="px-3 py-2 text-center"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <Label
          htmlFor="sheet-level-field"
          component="span"
          sx={{ margin: 0, color: APP_COLORS.goldSoft }}
        >
          Level
        </Label>
      </div>

      <div className="px-3 py-2">
        <TextField
          id="sheet-level-field"
          variant="standard"
          type="number"
          fullWidth
          value={value}
          onChange={handleChange}
          slotProps={{
            htmlInput: {
              min: 1,
              step: 1,
              style: { textAlign: 'center' },
            },
          }}
        />
      </div>
    </div>
  );
};
