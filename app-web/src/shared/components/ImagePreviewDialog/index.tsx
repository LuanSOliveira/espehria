'use client';

import { Box, Dialog } from '@mui/material';
import { Card } from '@/shared/components/Containers';

export interface ImagePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export const ImagePreviewDialog = ({
  open,
  onClose,
  imageUrl,
  alt,
}: ImagePreviewDialogProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={false}
    slotProps={{
      paper: { className: 'bg-transparent shadow-none m-4' },
    }}
  >
    <Card className="flex items-center justify-center">
      <Box
        component="img"
        src={imageUrl}
        alt={alt}
        sx={{
          maxHeight: '70vh',
          maxWidth: '100%',
          borderRadius: '4px',
          display: 'block',
        }}
      />
    </Card>
  </Dialog>
);
