'use client';

import { Box, IconButton, Tooltip } from '@mui/material';
import { FiMinus, FiPlus, FiRotateCcw } from 'react-icons/fi';
import { useFontAccessibilityStore } from '@/store';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_BUTTON_STYLES, APP_BUTTON_BASE_FONT_SIZE } from '@/shared/constants';

export const FontAccessibilityControls = () => {
  const increaseFont = useFontAccessibilityStore((state) => state.increaseFont);
  const decreaseFont = useFontAccessibilityStore((state) => state.decreaseFont);
  const resetFont = useFontAccessibilityStore((state) => state.resetFont);
  const iconFontSize = useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.icon);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 50,
        display: 'flex',
        gap: '8px',
      }}
    >
      <Tooltip title="Diminuir fonte">
        <IconButton
          aria-label="Diminuir fonte"
          onClick={decreaseFont}
          sx={[APP_BUTTON_STYLES.iconButton, { fontSize: iconFontSize }]}
        >
          <FiMinus />
        </IconButton>
      </Tooltip>
      <Tooltip title="Restaurar tamanho da fonte">
        <IconButton
          aria-label="Restaurar tamanho da fonte"
          onClick={resetFont}
          sx={[APP_BUTTON_STYLES.iconButton, { fontSize: iconFontSize }]}
        >
          <FiRotateCcw />
        </IconButton>
      </Tooltip>
      <Tooltip title="Aumentar fonte">
        <IconButton
          aria-label="Aumentar fonte"
          onClick={increaseFont}
          sx={[APP_BUTTON_STYLES.iconButton, { fontSize: iconFontSize }]}
        >
          <FiPlus />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
