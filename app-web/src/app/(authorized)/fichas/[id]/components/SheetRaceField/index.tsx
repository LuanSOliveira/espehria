'use client';

import { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { Label } from '@/shared/components/Texts';
import { ViewModal } from '@/shared/components/Modals';
import { RaceView } from '@/app/(authorized)/racas/components/RaceView';
import { IRaceListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';
import { SheetRaceCard } from '../SheetRaceCard';

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
  const [isEditing, setIsEditing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const showAutocomplete = value === null || isEditing;

  const handleChange = (newValue: IRaceListItem | null) => {
    onChange(newValue);
    if (newValue !== null) {
      setIsEditing(false);
    }
  };

  return (
    <div>
      <Label htmlFor={showAutocomplete ? 'sheet-race-field' : undefined}>
        Raça
      </Label>

      {showAutocomplete ? (
        <Autocomplete<IRaceListItem>
          id="sheet-race-field"
          options={options}
          getOptionLabel={(option) => option.name}
          value={value}
          onChange={(_event, newValue) => handleChange(newValue)}
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
      ) : (
        value && (
          <SheetRaceCard
            race={value}
            onView={() => setIsViewModalOpen(true)}
            onEdit={() => setIsEditing(true)}
          />
        )
      )}

      <ViewModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes da Raça"
        size="wide"
      >
        {value && <RaceView raceId={value.id} />}
      </ViewModal>
    </div>
  );
};
