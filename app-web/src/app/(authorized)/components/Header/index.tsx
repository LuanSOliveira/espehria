'use client';

import { Box, IconButton, Tooltip } from '@mui/material';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import { DefaultText } from '@/shared/components/Texts';
import { FontAccessibilityControls } from '@/shared/components/FontAccessibilityControls';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { useLogout, useMeQuery } from '@/hooks/Auth';
import { APP_BUTTON_STYLES, APP_BUTTON_BASE_FONT_SIZE, APP_COLORS } from '@/shared/constants';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { data: user } = useMeQuery();
  const logout = useLogout();
  const iconFontSize = useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.icon);

  return (
    <Box
      component="header"
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '10px 20px',
        backgroundImage: `linear-gradient(180deg, ${APP_COLORS.woodLight} 0%, ${APP_COLORS.wood} 100%)`,
        borderBottom: `2px solid ${APP_COLORS.gold}`,
      }}
    >
      <IconButton
        aria-label="Alternar menu lateral"
        onClick={onToggleSidebar}
        sx={[APP_BUTTON_STYLES.iconButton, { fontSize: iconFontSize }]}
      >
        <FiMenu />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
      </Box>
    </Box>
  );
};
