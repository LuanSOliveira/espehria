'use client';

import { IconButton, Tooltip, TooltipProps } from '@mui/material';
import { FiMinus, FiPlus, FiRotateCcw } from 'react-icons/fi';
import { useFontAccessibilityStore } from '@/store';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_BUTTON_STYLES, APP_BUTTON_BASE_FONT_SIZE } from '@/shared/constants';

const tooltipSlotProps: TooltipProps['slotProps'] = {
  popper: {
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          rootBoundary: 'viewport',
          altAxis: true,
          padding: 8,
        },
      },
    ],
  },
};

export const FontAccessibilityControls = () => {
  const increaseFont = useFontAccessibilityStore((state) => state.increaseFont);
  const decreaseFont = useFontAccessibilityStore((state) => state.decreaseFont);
  const resetFont = useFontAccessibilityStore((state) => state.resetFont);
  const iconFontSize = useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.icon);

  return (
    <div className="flex gap-2">
      <Tooltip title="Diminuir fonte" slotProps={tooltipSlotProps}>
        <IconButton
          aria-label="Diminuir fonte"
          onClick={decreaseFont}
          sx={[APP_BUTTON_STYLES.iconButton, { fontSize: iconFontSize }]}
        >
          <FiMinus />
        </IconButton>
      </Tooltip>
      <Tooltip title="Restaurar tamanho da fonte" slotProps={tooltipSlotProps}>
        <IconButton
          aria-label="Restaurar tamanho da fonte"
          onClick={resetFont}
          sx={[APP_BUTTON_STYLES.iconButton, { fontSize: iconFontSize }]}
        >
          <FiRotateCcw />
        </IconButton>
      </Tooltip>
      <Tooltip
        title="Aumentar fonte"
        placement="bottom-end"
        slotProps={tooltipSlotProps}
      >
        <IconButton
          aria-label="Aumentar fonte"
          onClick={increaseFont}
          sx={[APP_BUTTON_STYLES.iconButton, { fontSize: iconFontSize }]}
        >
          <FiPlus />
        </IconButton>
      </Tooltip>
    </div>
  );
};
