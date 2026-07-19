'use client';

import { IconButton, Tooltip } from '@mui/material';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { FontAccessibilityControls } from '@/shared/components/FontAccessibilityControls';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { useLogout, useMeQuery } from '@/hooks/Auth';
import {
  APP_BUTTON_STYLES,
  APP_BUTTON_BASE_FONT_SIZE,
  APP_COLORS,
} from '@/shared/constants';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { data: user } = useMeQuery();
  const logout = useLogout();
  const iconFontSize = useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.icon);

  return (
    <header
      className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-gold px-5 py-2.5"
      style={{
        backgroundImage: `linear-gradient(180deg, ${APP_COLORS.woodLight} 0%, ${APP_COLORS.wood} 100%)`,
      }}
    >
      <IconButton
        aria-label="Alternar menu lateral"
        onClick={onToggleSidebar}
        sx={[APP_BUTTON_STYLES.iconButton, { fontSize: iconFontSize }]}
      >
        <FiMenu />
      </IconButton>

      <div className="flex items-center gap-4">
        <DefaultText
          component="span"
          sx={{ color: APP_COLORS.goldSoft, whiteSpace: 'nowrap' }}
        >
          {user?.name ? `Bem vindo, ${user.name}` : 'Bem vindo'}
        </DefaultText>

        <FontAccessibilityControls />

        <Tooltip title="Sair">
          <IconButton
            aria-label="Sair"
            onClick={logout}
            sx={[APP_BUTTON_STYLES.iconButton, { fontSize: iconFontSize }]}
          >
            <FiLogOut />
          </IconButton>
        </Tooltip>
      </div>
    </header>
  );
};
