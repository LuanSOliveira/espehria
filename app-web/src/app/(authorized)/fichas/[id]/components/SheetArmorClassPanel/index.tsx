'use client';

import { Autocomplete, IconButton, TextField, Tooltip } from '@mui/material';
import { FiHelpCircle, FiShield } from 'react-icons/fi';
import { Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { IAttribute } from '@/shared/interfaces';
import { SheetModifierCircle } from '../SheetModifierCircle';

export interface SheetArmorClassPanelProps {
  total: number;
  keyAttribute: IAttribute | null;
  keyAttributeOptions: IAttribute[];
  onKeyAttributeChange: (attribute: IAttribute) => void;
  onOpenDetail: () => void;
}

export const SheetArmorClassPanel = ({
  total,
  keyAttribute,
  keyAttributeOptions,
  onKeyAttributeChange,
  onOpenDetail,
}: SheetArmorClassPanelProps) => {
  return (
    <div style={APP_CONTAINER_STYLES.detailSectionBox}>
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <FiShield style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          Classe de Armadura
        </Label>
      </div>

      <div className="flex items-end gap-3 p-4">
        <SheetModifierCircle value={total} signed={false} />

        <Tooltip title="Ver detalhamento do bônus">
          <IconButton
            aria-label="Ver detalhamento do bônus"
            onClick={onOpenDetail}
            size="small"
            sx={{
              color: APP_COLORS.textBrownDark,
              border: `1px solid ${APP_COLORS.gold}`,
            }}
          >
            <FiHelpCircle style={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        <div className="flex-1">
          <Label htmlFor="armor-class-key-attribute">Atributo-chave</Label>
          <Autocomplete<IAttribute>
            id="armor-class-key-attribute"
            options={keyAttributeOptions}
            getOptionLabel={(option) => option.name}
            value={keyAttribute}
            onChange={(_event, newValue) => {
              if (newValue === null) {
                return;
              }

              onKeyAttributeChange(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                placeholder="Atributo-chave"
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
      </div>
    </div>
  );
};
