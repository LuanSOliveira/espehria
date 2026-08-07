'use client';

import { Box } from '@mui/material';
import { DefaultText } from '@/shared/components/Texts';
import { APP_COLORS } from '@/shared/constants';

export interface SheetModifierCircleProps {
  value: number;
  signed?: boolean;
}

/**
 * Círculo de modificador (44x44, fundo `wood`, borda `gold`) — extraído de
 * `SheetSkillCard`/`SheetKnowledgeCard`, onde vivia duplicado, e reaproveitado
 * também pelo valor de Classe de Armadura em `SheetArmorClassPanel`. Puramente
 * apresentacional, sem nenhuma lógica de cálculo.
 *
 * `signed` controla o prefixo `+` em valores positivos (default `true`, usado
 * por modificadores de Perícias/Saberes/Salvamentos); Classe de Armadura é um
 * valor absoluto, não um modificador, então usa `signed={false}`.
 */
export const SheetModifierCircle = ({ value, signed = true }: SheetModifierCircleProps) => {
  const valueLabel = signed && value > 0 ? `+${value}` : `${value}`;

  return (
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
        {valueLabel}
      </DefaultText>
    </Box>
  );
};
