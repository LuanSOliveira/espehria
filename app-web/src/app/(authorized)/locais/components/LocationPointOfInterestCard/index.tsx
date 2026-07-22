'use client';

import { IconButton, Tooltip } from '@mui/material';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { useEntityMentionViewStore } from '@/store';
import { ILocationSummary } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface LocationPointOfInterestCardProps {
  location: ILocationSummary;
  onRemove?: () => void;
}

export const LocationPointOfInterestCard = ({
  location,
  onRemove,
}: LocationPointOfInterestCardProps) => {
  const openEntityView = useEntityMentionViewStore(
    (state) => state.openEntityView,
  );

  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailInfoField}
    >
      <ImageAvatarPreview
        imageUrl={location.referenceImageUrl}
        alt={location.name}
      />

      <DefaultText className="flex-1">{location.name}</DefaultText>

      <Tooltip title="Visualizar">
        <IconButton
          aria-label={`Visualizar ${location.name}`}
          onClick={() => openEntityView('location', location.id)}
          sx={{ color: APP_COLORS.textBrownDark }}
        >
          <FiEye />
        </IconButton>
      </Tooltip>

      {onRemove && (
        <Tooltip title="Excluir">
          <IconButton
            aria-label={`Excluir ${location.name}`}
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
