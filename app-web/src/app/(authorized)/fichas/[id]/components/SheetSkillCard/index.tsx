'use client';

import { Box, IconButton, Tooltip } from '@mui/material';
import { FiHelpCircle } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetSkillCardProps {
  name: string;
  keyAttributeName: string;
  gradationName: string;
  total: number;
  onOpenDetail: () => void;
}

export const SheetSkillCard = ({
  name,
  keyAttributeName,
  gradationName,
  total,
  onOpenDetail,
}: SheetSkillCardProps) => {
  const totalLabel = total > 0 ? `+${total}` : `${total}`;

  return (
    <Box sx={{ position: 'relative', ...APP_CONTAINER_STYLES.detailSectionBox }}>
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="flex flex-1 flex-col gap-1">
          <Label component="span" sx={{ margin: 0 }}>
            {name}
          </Label>
          <DefaultText sx={{ fontStyle: 'italic' }}>
            {`Atributo-chave: ${keyAttributeName}`}
          </DefaultText>
          <DefaultText>{`Graduação: ${gradationName}`}</DefaultText>
        </div>

        <div className="flex flex-row items-center gap-2">
          <Tooltip title="Ver detalhamento do bônus">
            <IconButton
              aria-label="Ver detalhamento do bônus"
              onClick={onOpenDetail}
              size="small"
              sx={{
                color: APP_COLORS.goldSoft,
                border: `1px solid ${APP_COLORS.gold}`,
              }}
            >
              <FiHelpCircle style={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Box
            sx={{
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
                fontSize: '1.1rem',
                fontWeight: 700,
                lineHeight: 1,
                color: APP_COLORS.goldSoft,
              }}
            >
              {totalLabel}
            </DefaultText>
          </Box>
        </div>
      </div>
    </Box>
  );
};
