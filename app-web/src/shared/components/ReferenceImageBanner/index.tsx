'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { FiImage } from 'react-icons/fi';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { APP_COLORS, APP_CONTAINER_STYLES } from '@/shared/constants';

export interface ReferenceImageBannerProps {
  imageUrl?: string | null;
  alt: string;
  height?: number;
}

const DEFAULT_HEIGHT = 420;
const FADE_HEIGHT = 120;

export const ReferenceImageBanner = ({
  imageUrl,
  alt,
  height = DEFAULT_HEIGHT,
}: ReferenceImageBannerProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!imageUrl) {
    return (
      <Box
        sx={{
          ...APP_CONTAINER_STYLES.referenceImageBanner,
          width: '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: APP_COLORS.wood,
          color: APP_COLORS.gold,
        }}
      >
        <FiImage style={{ fontSize: 64 }} />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ ...APP_CONTAINER_STYLES.referenceImageBanner, width: '100%' }}>
        <button
          type="button"
          aria-label={`Ampliar imagem de ${alt}`}
          onClick={() => setIsPreviewOpen(true)}
          className="block w-full cursor-pointer border-0 bg-transparent p-0"
        >
          <Box
            component="img"
            src={imageUrl}
            alt={alt}
            sx={{
              width: '100%',
              height,
              objectFit: 'cover',
              objectPosition: 'top',
              display: 'block',
            }}
          />
        </button>

        <Box
          aria-hidden
          sx={{
            ...APP_CONTAINER_STYLES.referenceImageBannerFade,
            height: FADE_HEIGHT,
          }}
        />
      </Box>

      <ImagePreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={imageUrl}
        alt={alt}
      />
    </>
  );
};
