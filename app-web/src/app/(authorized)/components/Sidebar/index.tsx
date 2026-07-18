'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { FiHome } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { DefaultText } from '@/shared/components/Texts';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_BUTTON_BASE_FONT_SIZE, APP_COLORS } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';

export const SIDEBAR_WIDTH = 240;

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: APP_ROUTES.private.home, icon: FiHome },
];

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const pathname = usePathname();
  const iconFontSize = useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.icon);

  return (
    <Box
      component="aside"
      sx={{
        width: isOpen ? SIDEBAR_WIDTH : 0,
        minWidth: isOpen ? SIDEBAR_WIDTH : 0,
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'width 0.25s ease, min-width 0.25s ease',
        backgroundImage: `linear-gradient(180deg, ${APP_COLORS.woodLight} 0%, ${APP_COLORS.wood} 100%)`,
        borderRight: `2px solid ${APP_COLORS.gold}`,
      }}
    >
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_WIDTH,
          height: '100%',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  border: '1px solid transparent',
                  backgroundColor: isActive
                    ? 'rgba(184,147,63,0.25)'
                    : 'transparent',
                  borderColor: isActive ? APP_COLORS.gold : 'transparent',
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(184,147,63,0.15)',
                  },
                }}
              >
                <Icon
                  style={{
                    fontSize: iconFontSize,
                    color: APP_COLORS.goldSoft,
                    flexShrink: 0,
                  }}
                />
                <DefaultText
                  component="span"
                  sx={{
                    color: APP_COLORS.goldSoft,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </DefaultText>
              </Box>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
};
