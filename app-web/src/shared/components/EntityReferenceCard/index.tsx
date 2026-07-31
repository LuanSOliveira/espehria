'use client';

import { IconButton, Tooltip } from '@mui/material';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { TagBadge } from '@/shared/components/TagBadge';
import { useEntityMentionViewStore } from '@/store';
import { IEntityReference } from '@/shared/interfaces';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface EntityReferenceCardProps {
  reference: IEntityReference;
  onRemove?: () => void;
}

export const EntityReferenceCard = ({
  reference,
  onRemove,
}: EntityReferenceCardProps) => {
  const openEntityView = useEntityMentionViewStore(
    (state) => state.openEntityView,
  );

  return (
    <div
      className="flex items-center gap-3 px-3 py-2"
      style={APP_CONTAINER_STYLES.detailInfoField}
    >
      <div className="flex flex-1 flex-col gap-1">
        <DefaultText>{reference.name}</DefaultText>
        {reference.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {reference.tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
        )}
      </div>

      <Tooltip title="Visualizar">
        <IconButton
          aria-label={`Visualizar ${reference.name}`}
          onClick={() => openEntityView(reference.entityType, reference.id)}
          sx={{ color: APP_COLORS.textBrownDark }}
        >
          <FiEye />
        </IconButton>
      </Tooltip>

      {onRemove && (
        <Tooltip title="Remover">
          <IconButton
            aria-label={`Remover ${reference.name}`}
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
