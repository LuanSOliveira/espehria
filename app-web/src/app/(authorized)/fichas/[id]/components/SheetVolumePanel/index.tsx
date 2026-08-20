'use client';

import { Tooltip } from '@mui/material';
import { FiInfo, FiPackage } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetVolumePanelProps {
  currentVolume: number;
  maxVolume: number;
  limitVolume: number;
}

const VALUE_TEXT_SX = {
  fontSize: '2rem',
  fontWeight: 700,
  color: APP_COLORS.textBrownDark,
  lineHeight: '41px',
};

/**
 * Somente exibição: `currentVolume`, `maxVolume` e `limitVolume` já chegam
 * calculados de `page.tsx` (mesmo padrão de Classe de Armadura/PV máximo).
 */
export const SheetVolumePanel = ({
  currentVolume,
  maxVolume,
  limitVolume,
}: SheetVolumePanelProps) => {
  const isOverloaded = currentVolume > maxVolume;

  return (
    <div style={APP_CONTAINER_STYLES.detailSectionBox}>
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailSectionBoxHeader}
      >
        <FiPackage style={{ fontSize: 16, color: APP_COLORS.goldSoft }} />
        <Label component="span" sx={{ margin: 0, color: APP_COLORS.goldSoft }}>
          Volume
        </Label>
        <Tooltip
          title="Volume Máximo = 5 + modificador de Força. Volume Limite = modificador de Força + 10."
        >
          <span className="ml-auto flex items-center">
            <FiInfo style={{ fontSize: 14, color: APP_COLORS.goldSoft }} />
          </span>
        </Tooltip>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <Label>Volume</Label>
            <div className="flex items-center gap-2">
              <DefaultText
                sx={{
                  ...VALUE_TEXT_SX,
                  ...(isOverloaded ? { color: APP_COLORS.alertRed } : {}),
                }}
              >
                {currentVolume}
              </DefaultText>
              <DefaultText sx={VALUE_TEXT_SX}>/</DefaultText>
              <DefaultText sx={VALUE_TEXT_SX}>{maxVolume}</DefaultText>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Label>Volume Limite</Label>
            <DefaultText sx={VALUE_TEXT_SX}>{limitVolume}</DefaultText>
          </div>
        </div>

        <DefaultText sx={{ fontStyle: 'italic', textAlign: 'center' }}>
          {`*Se carregar mais do que ${maxVolume} Volume(s), você adquire a condição sobrecarregado`}
        </DefaultText>
      </div>
    </div>
  );
};
