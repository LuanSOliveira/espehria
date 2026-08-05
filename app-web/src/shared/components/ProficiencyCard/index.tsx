'use client';

import { IconButton, Tooltip } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { IProficiencyItem } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface ProficiencyCardProps {
  /**
   * Aceita tanto o item completo (`IProficiencyItem`, com `id` real) quanto
   * um snapshot de ficha, cujo `id` pode ser `null` — o card não usa `id`, só
   * exibe propriedade/graduação.
   */
  item: Omit<IProficiencyItem, 'id'> & { id?: string | null };
  onRemove?: () => void;
}

export const ProficiencyCard = ({ item, onRemove }: ProficiencyCardProps) => {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailInfoField}
    >
      <div className="flex flex-1 flex-col gap-1">
        <DefaultText>{`Propriedade: ${item.property.name}`}</DefaultText>
        <DefaultText>{`Graduação: ${item.gradation.name}`}</DefaultText>
      </div>

      {onRemove && (
        <Tooltip title="Remover">
          <IconButton
            aria-label={`Remover proficiência de ${item.property.name}`}
            onClick={onRemove}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiTrash2 />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};
