'use client';

import { useState } from 'react';
import { Avatar, IconButton } from '@mui/material';
import { FiImage } from 'react-icons/fi';
import { ImagePreviewDialog } from '@/shared/components/ImagePreviewDialog';
import { APP_COLORS } from '@/shared/constants';

export interface ImageAvatarPreviewProps {
  imageUrl?: string | null;
  alt: string;
  size?: number;
}

const DEFAULT_SIZE = 32;

export const ImageAvatarPreview = ({
  imageUrl,
  alt,
  size = DEFAULT_SIZE,
}: ImageAvatarPreviewProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const avatarSx = {
    width: size,
    height: size,
    backgroundColor: APP_COLORS.wood,
    color: APP_COLORS.gold,
    border: `1px solid ${APP_COLORS.goldDark}`,
  };

  if (!imageUrl) {
    return (
      <Avatar alt={alt} sx={avatarSx}>
        <FiImage size={size * 0.5} />
      </Avatar>
    );
  }

  return (
    <>
      <IconButton
        aria-label={`Ampliar imagem de ${alt}`}
        onClick={() => setIsPreviewOpen(true)}
        sx={{ padding: 0 }}
      >
        <Avatar alt={alt} src={imageUrl} sx={avatarSx} />
      </IconButton>

      <ImagePreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={imageUrl}
        alt={alt}
      />
    </>
  );
};
