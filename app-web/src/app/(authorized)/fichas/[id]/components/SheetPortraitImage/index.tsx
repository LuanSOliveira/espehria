'use client';

import { MouseEvent, useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { FiEdit2, FiImage } from 'react-icons/fi';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { APP_COLORS } from '@/shared/constants';

export interface SheetPortraitImageProps {
  imageUrl?: string | null;
  alt: string;
  onEditClick: () => void;
}

export const SheetPortraitImage = ({
  imageUrl,
  alt,
  onEditClick,
}: SheetPortraitImageProps) => {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  const handleEditClick = (event: MouseEvent) => {
    event.stopPropagation();
    onEditClick();
  };

  return (
    <div
      className="relative w-40 h-full shrink-0 overflow-hidden rounded-md sm:w-48"
      style={{
        aspectRatio: '3 / 4',
        border: `1px solid ${APP_COLORS.goldDark}`,
        backgroundColor: APP_COLORS.parchmentLight,
      }}
    >
      {imageUrl ? (
        <>
          <Box
            component="button"
            type="button"
            aria-label={`Ampliar imagem de ${alt}`}
            onClick={() => setIsImagePreviewOpen(true)}
            className="cursor-pointer border-0 bg-transparent p-0"
            sx={{ width: '100%', height: '100%', display: 'block' }}
          >
            <Box
              component="img"
              src={imageUrl}
              alt={alt}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </Box>

          <ImagePreviewDialog
            open={isImagePreviewOpen}
            onClose={() => setIsImagePreviewOpen(false)}
            imageUrl={imageUrl}
            alt={alt}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <FiImage style={{ fontSize: 48, color: APP_COLORS.goldDark }} />
        </div>
      )}

      <Tooltip title="Editar imagem">
        <IconButton
          aria-label="Editar imagem da ficha"
          onClick={handleEditClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: APP_COLORS.wood,
            color: APP_COLORS.goldSoft,
            '&:hover': { backgroundColor: APP_COLORS.woodLight },
          }}
        >
          <FiEdit2 />
        </IconButton>
      </Tooltip>
    </div>
  );
};
