'use client';

import { Box } from '@mui/material';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetAttributeCardProps {
  label: string;
  value: number;
  modifier: number;
}

export const SheetAttributeCard = ({
  label,
  value,
  modifier,
}: SheetAttributeCardProps) => {
  const modifierLabel = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  return (
    <Box sx={{ position: 'relative', ...APP_CONTAINER_STYLES.detailSectionBox }}>
      <div
        className="px-3 py-2 text-center"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          {label}
        </Label>
      </div>

      <div className="flex items-center justify-center py-5">
        <DefaultText
          sx={{ fontSize: '1.5rem', fontWeight: 700, color: APP_COLORS.textBrownDark }}
        >
          {value}
        </DefaultText>
      </div>

      <Box
        sx={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: APP_COLORS.wood,
          border: `1px solid ${APP_COLORS.gold}`,
        }}
      >
        <DefaultText
          sx={{
            fontSize: '1.7rem',
            fontWeight: 700,
            lineHeight: 1,
            color: APP_COLORS.goldSoft,
          }}
        >
          {modifierLabel}
        </DefaultText>
      </Box>
    </Box>
  );
};
