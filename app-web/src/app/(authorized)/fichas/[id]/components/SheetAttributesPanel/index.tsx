'use client';

import { IconButton, Tooltip } from '@mui/material';
import { FiList } from 'react-icons/fi';
import { Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';
import { SheetAttributeCard } from '../SheetAttributeCard';

export interface SheetAttributesPanelAttribute {
  id: string;
  label: string;
  value: number;
  modifier: number;
}

export interface SheetAttributesPanelProps {
  attributes: SheetAttributesPanelAttribute[];
  onOpenDetails: () => void;
}

export const SheetAttributesPanel = ({
  attributes,
  onOpenDetails,
}: SheetAttributesPanelProps) => {
  return (
    <div style={APP_CONTAINER_STYLES.detailSectionBox}>
      <div
        className="flex items-center justify-between px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          Atributos
        </Label>

        <Tooltip title="Ver melhorias e defeitos de atributo">
          <IconButton
            aria-label="Ver melhorias e defeitos de atributo"
            onClick={onOpenDetails}
            size="small"
            sx={{
              color: APP_COLORS.goldSoft,
              border: `1px solid ${APP_COLORS.gold}`,
            }}
          >
            <FiList style={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        {attributes.map((attribute) => (
          <SheetAttributeCard
            key={attribute.id}
            label={attribute.label}
            value={attribute.value}
            modifier={attribute.modifier}
          />
        ))}
      </div>
    </div>
  );
};
