'use client';

import { IconButton, Tooltip } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { IKnowledgeItem } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface KnowledgeCardProps {
  /**
   * Aceita tanto o item completo (`IKnowledgeItem`, com `id` real) quanto um
   * snapshot de ficha, cujo `id` pode ser `null` — o card não usa `id`, só
   * exibe título/graduação.
   */
  item: Omit<IKnowledgeItem, 'id'> & { id?: string | null };
  onRemove?: () => void;
}

export const KnowledgeCard = ({ item, onRemove }: KnowledgeCardProps) => {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailInfoField}
    >
      <div className="flex flex-1 flex-col gap-1">
        <DefaultText>{`Título: ${item.title}`}</DefaultText>
        <DefaultText>{`Graduação: ${item.gradation.name}`}</DefaultText>
      </div>

      {onRemove && (
        <Tooltip title="Remover">
          <IconButton
            aria-label={`Remover saber ${item.title}`}
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
