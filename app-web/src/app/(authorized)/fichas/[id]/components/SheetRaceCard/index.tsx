'use client';

import { Chip, IconButton, Tooltip } from '@mui/material';
import { FiEdit2, FiEye } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { IRaceListItem } from '@/shared/interfaces';
import { getContrastTextColor } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetRaceCardProps {
  race: IRaceListItem;
  onView: () => void;
  onEdit: () => void;
}

export const SheetRaceCard = ({ race, onView, onEdit }: SheetRaceCardProps) => {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailInfoField}
    >
      <ImageAvatarPreview imageUrl={race.referenceImageUrl} alt={race.name} />

      <div className="flex flex-1 flex-col gap-1">
        <DefaultText>{race.name}</DefaultText>
        {race.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {race.tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{
                  backgroundColor: tag.color,
                  color: getContrastTextColor(tag.color),
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Tooltip title="Visualizar">
        <IconButton
          aria-label={`Visualizar ${race.name}`}
          onClick={onView}
          sx={{ color: APP_COLORS.textBrownDark }}
        >
          <FiEye />
        </IconButton>
      </Tooltip>

      <Tooltip title="Editar">
        <IconButton
          aria-label={`Editar ${race.name}`}
          onClick={onEdit}
          sx={{ color: APP_COLORS.textBrownDark }}
        >
          <FiEdit2 />
        </IconButton>
      </Tooltip>
    </div>
  );
};
