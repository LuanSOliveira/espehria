'use client';

import { useState } from 'react';
import {
  Autocomplete,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import { FiX } from 'react-icons/fi';
import { Label } from '@/shared/components/Texts';
import { ViewModal } from '@/shared/components/Modals';
import { RaceView } from '@/app/(authorized)/racas/components/RaceView';
import { IRaceListItem } from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';
import { SheetRaceCard } from '../SheetRaceCard';
import { SheetDashedFieldButton } from '../SheetDashedFieldButton';

export interface SheetRaceFieldProps {
  value: IRaceListItem | null;
  options: IRaceListItem[];
  onAssign: (raceId: string) => void;
  onRemove: () => void;
  isSaving?: boolean;
  isRemoving?: boolean;
}

export const SheetRaceField = ({
  value,
  options,
  onAssign,
  onRemove,
  isSaving,
  isRemoving,
}: SheetRaceFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleChange = (newValue: IRaceListItem | null) => {
    if (!newValue) {
      return;
    }

    onAssign(newValue.id);
    setIsEditing(false);
  };

  return (
    <div>
      <Label htmlFor={isEditing ? 'sheet-race-field' : undefined}>Raça</Label>

      {isEditing && (
        <div className="flex items-center gap-2">
          <Autocomplete<IRaceListItem>
            id="sheet-race-field"
            options={options}
            getOptionLabel={(option) => option.name}
            value={value}
            onChange={(_event, newValue) => handleChange(newValue)}
            disabled={isSaving}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                placeholder="Selecione a raça"
                slotProps={{
                  ...params.slotProps,
                  input: {
                    ...params.slotProps.input,
                    endAdornment: isSaving ? (
                      <CircularProgress size={16} sx={{ color: APP_COLORS.gold }} />
                    ) : (
                      params.slotProps.input.endAdornment
                    ),
                  },
                }}
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

          {value && (
            <Tooltip title="Cancelar">
              <IconButton
                aria-label="Cancelar edição da raça"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                sx={{ color: APP_COLORS.textBrownDark }}
              >
                <FiX />
              </IconButton>
            </Tooltip>
          )}
        </div>
      )}

      {!isEditing && value && (
        <SheetRaceCard
          race={value}
          onView={() => setIsViewModalOpen(true)}
          onEdit={() => setIsEditing(true)}
          onRemove={onRemove}
          isRemoving={isRemoving}
        />
      )}

      {!isEditing && !value && (
        <SheetDashedFieldButton
          label="Adicionar raça"
          onClick={() => setIsEditing(true)}
        />
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
