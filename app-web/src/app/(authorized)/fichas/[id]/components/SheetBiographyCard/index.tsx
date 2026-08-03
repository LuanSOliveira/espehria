'use client';

import { useState } from 'react';
import { Chip, IconButton, Tooltip } from '@mui/material';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { ConfirmationModal } from '@/shared/components/Modals';
import { IBiographyListItem } from '@/shared/interfaces';
import { getContrastTextColor } from '@/shared/util';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetBiographyCardProps {
  biography: IBiographyListItem;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
  isRemoving?: boolean;
}

export const SheetBiographyCard = ({
  biography,
  onView,
  onEdit,
  onRemove,
  isRemoving = false,
}: SheetBiographyCardProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <div
        className="flex items-center gap-3 px-3 py-2"
        style={APP_CONTAINER_STYLES.detailInfoField}
      >
        <ImageAvatarPreview
          imageUrl={biography.imageReference}
          alt={biography.name}
        />

        <div className="flex flex-1 flex-col gap-1">
          <DefaultText>{biography.name}</DefaultText>
          {biography.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {biography.tags.map((tag) => (
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
            aria-label={`Visualizar ${biography.name}`}
            onClick={onView}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEye />
          </IconButton>
        </Tooltip>

        <Tooltip title="Editar">
          <IconButton
            aria-label={`Editar ${biography.name}`}
            onClick={onEdit}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiEdit2 />
          </IconButton>
        </Tooltip>

        <Tooltip title="Remover">
          <IconButton
            aria-label={`Remover ${biography.name}`}
            onClick={() => setIsConfirmOpen(true)}
            sx={{ color: APP_COLORS.textBrownDark }}
          >
            <FiTrash2 />
          </IconButton>
        </Tooltip>
      </div>

      <ConfirmationModal
        open={isConfirmOpen}
        title="Remover biografia"
        message={`Tem certeza que deseja remover a biografia "${biography.name}" desta ficha?`}
        confirmLabel="Remover"
        isLoading={isRemoving}
        onConfirm={() => {
          onRemove();
          setIsConfirmOpen(false);
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
};
