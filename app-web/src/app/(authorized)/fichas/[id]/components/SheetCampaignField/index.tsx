'use client';

import { Autocomplete, TextField } from '@mui/material';
import { Label } from '@/shared/components/Texts';
import { ISheetCampaignOption } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface SheetCampaignFieldProps {
  value: ISheetCampaignOption | null;
  onChange: (value: ISheetCampaignOption | null) => void;
  options: ISheetCampaignOption[];
}

export const SheetCampaignField = ({
  value,
  onChange,
  options,
}: SheetCampaignFieldProps) => {
  return (
    <div>
      <Label htmlFor="sheet-campaign-field">Campanha</Label>
      <Autocomplete<ISheetCampaignOption>
        id="sheet-campaign-field"
        options={options}
        getOptionLabel={(option) => option.name}
        value={value}
        onChange={(_event, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            placeholder="Selecione a campanha"
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
