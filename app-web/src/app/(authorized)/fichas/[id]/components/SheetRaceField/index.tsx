'use client';

import { Autocomplete, TextField } from '@mui/material';
import { Label } from '@/shared/components/Texts';
import { IRaceListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface SheetRaceFieldProps {
  value: IRaceListItem | null;
  onChange: (value: IRaceListItem | null) => void;
  options: IRaceListItem[];
}

export const SheetRaceField = ({
  value,
  onChange,
  options,
}: SheetRaceFieldProps) => {
  return (
    <div>
      <Label htmlFor="sheet-race-field">Raça</Label>
      <Autocomplete<IRaceListItem>
        id="sheet-race-field"
        options={options}
        getOptionLabel={(option) => option.name}
        value={value}
        onChange={(_event, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            placeholder="Selecione a raça"
            sx={{
              '& .MuiInput-root:before': { borderBottom: 'none' },
              '& .MuiInput-root:hover:not(.Mui-disabled):before': {
                borderBottom: `1px solid ${APP_COLORS.goldDark}`,
              },
              '& .MuiInput-root:after': {
                borderBottom: `2px solid ${APP_COLORS.gold}`,
              },
              '& .MuiInputBase-input': {
                fontSize: '1.125rem',
                color: APP_COLORS.textBrownDark,
              },
            }}
          />
        )}
      />
    </div>
  );
};
