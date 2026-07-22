'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Divider } from '@mui/material';
import { FiFeather, FiHome, FiMapPin, FiTag, FiUsers } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { APP_BUTTON_BASE_FONT_SIZE, APP_COLORS } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: 'Home', href: APP_ROUTES.private.home, icon: FiHome }],
  },
  {
    title: 'Mundo',
    items: [
      {
        label: 'Criaturas',
        href: APP_ROUTES.private.creatures,
        icon: FiFeather,
      },
      {
        label: 'Locais',
        href: APP_ROUTES.private.locations,
        icon: FiMapPin,
      },
    ],
  },
  {
    title: 'Gerenciamento',
    items: [
      { label: 'Usuários', href: APP_ROUTES.private.users, icon: FiUsers },
      { label: 'Tags', href: APP_ROUTES.private.tags, icon: FiTag },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const pathname = usePathname();
  const iconFontSize = useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.icon);

  return (
    <aside
      className={`h-full shrink-0 overflow-hidden border-r-2 border-gold transition-[width,min-width] duration-250 ease-in-out ${
        isOpen ? 'w-60 min-w-60' : 'w-0 min-w-0'
      }`}
      style={{
        backgroundImage: `linear-gradient(180deg, ${APP_COLORS.woodLight} 0%, ${APP_COLORS.wood} 100%)`,
      }}
    >
      <nav className="flex h-full w-60 flex-col gap-1 overflow-y-auto py-4 px-3">
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div
            key={section.title ?? `section-${sectionIndex}`}
            className="flex flex-col gap-1"
          >
            {sectionIndex > 0 && (
              <Divider
                sx={{
                  borderColor: APP_COLORS.gold,
                  opacity: 0.35,
                  margin: '12px 0 8px',
                }}
              />
            )}

            {section.title && (
              <Label
                sx={{
                  color: APP_COLORS.gold,
                  marginBottom: '4px',
                  paddingLeft: '14px',
                }}
              >
                {section.title}
              </Label>
            )}

            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className={`flex items-center gap-3 rounded border py-2.5 px-3.5 transition-colors duration-150 ease-in-out hover:bg-gold/15 ${
                      isActive
                        ? 'border-gold bg-gold/25'
                        : 'border-transparent bg-transparent'
                    }`}
                  >
                    <Icon
                      className="shrink-0 text-gold-soft"
                      style={{ fontSize: iconFontSize }}
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
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};
