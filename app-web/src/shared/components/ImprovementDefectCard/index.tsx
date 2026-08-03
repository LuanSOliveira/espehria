'use client';

import { IconButton, Tooltip } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { IImprovementDefectItem } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface ImprovementDefectCardProps {
  /**
   * Aceita tanto o item completo (`IImprovementDefectItem`, com `id` real)
   * quanto um snapshot de ficha (`ISheetImprovementDefectSnapshotEntry`, cujo
   * `id` pode ser `null` para a melhoria de atributo livre) — o card não usa
   * `id`, só exibe valor/tipo/propriedade.
   */
  item: Omit<IImprovementDefectItem, 'id'> & { id?: string | null };
  onRemove?: () => void;
}

export const ImprovementDefectCard = ({
  item,
  onRemove,
}: ImprovementDefectCardProps) => {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailInfoField}
    >
      <div className="flex flex-1 flex-col gap-1">
        <DefaultText>{`Valor: ${item.value}`}</DefaultText>
        <DefaultText>{`${item.type.name} · ${item.property.name}`}</DefaultText>
      </div>

      {onRemove && (
        <Tooltip title="Remover">
          <IconButton
            aria-label={`Remover item de valor ${item.value}`}
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
