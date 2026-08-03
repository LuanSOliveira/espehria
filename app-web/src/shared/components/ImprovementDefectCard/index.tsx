'use client';

import { IconButton, Tooltip } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { IImprovementDefectItem } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface ImprovementDefectCardProps {
  item: IImprovementDefectItem;
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
