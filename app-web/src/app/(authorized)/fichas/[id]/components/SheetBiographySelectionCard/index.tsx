'use client';

import { Box } from '@mui/material';
import { Label } from '@/shared/components/Texts';
import { PrimaryButton, SecondaryButton } from '@/shared/components/Buttons';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import { TagBadge } from '@/shared/components/TagBadge';
import { IBiographyListItem } from '@/shared/interfaces';
import { APP_CONTAINER_STYLES } from '@/shared/constants';

export interface SheetBiographySelectionCardProps {
  biography: IBiographyListItem;
  onView: () => void;
  onSelect: () => void;
}

export const SheetBiographySelectionCard = ({
  biography,
  onView,
  onSelect,
}: SheetBiographySelectionCardProps) => {
  return (
    <Box sx={APP_CONTAINER_STYLES.detailSectionBox}>
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-3">
          <ImageAvatarPreview
            imageUrl={biography.imageReference}
            alt={biography.name}
            size={48}
          />

          <div className="flex flex-1 flex-col gap-1">
            <Label component="span" sx={{ margin: 0, fontWeight: 700 }}>
              {biography.name}
            </Label>
            {biography.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {biography.tags.map((tag) => (
                  <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <SecondaryButton
            type="button"
            onClick={onView}
            sx={{ width: 'auto', padding: '8px 16px' }}
          >
            Visualizar
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={onSelect}
            sx={{ width: 'auto', padding: '8px 16px' }}
          >
            Selecionar
          </PrimaryButton>
        </div>
      </div>
    </Box>
  );
};
