'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Divider } from '@mui/material';
import { DefaultText } from '@/shared/components/Texts';
import { useAccessibleFontSize } from '@/hooks/FontAccessibility';
import { useIsGoogleUser } from '@/hooks/Auth';
import { APP_BUTTON_BASE_FONT_SIZE, APP_COLORS } from '@/shared/constants';
import { APP_ROUTES } from '@/shared/routes';
import { NAV_SECTIONS, NavItem } from './data';
import { SidebarSectionAccordion } from './components/SidebarSectionAccordion';

interface SidebarProps {
  isOpen: boolean;
}

const GOOGLE_BLOCKED_ROUTES = [
  APP_ROUTES.private.users,
  APP_ROUTES.private.campaigns,
];

const isRouteActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

const isItemActive = (pathname: string, item: NavItem): boolean =>
  (!!item.href && isRouteActive(pathname, item.href)) ||
  !!item.children?.some((child) => isItemActive(pathname, child));

const getSectionForPathname = (pathname: string): string | null => {
  const activeSection = NAV_SECTIONS.find(
    (section) =>
      section.title &&
      section.items.some((item) => isItemActive(pathname, item)),
  );

  return activeSection?.title ?? null;
};

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const pathname = usePathname();
  const iconFontSize = useAccessibleFontSize(APP_BUTTON_BASE_FONT_SIZE.icon);
  const isGoogleUser = useIsGoogleUser();
  const [expandedSection, setExpandedSection] = useState<string | null>(() =>
    getSectionForPathname(pathname),
  );
  const [pathnameForSection, setPathnameForSection] = useState(pathname);

  if (pathname !== pathnameForSection) {
    setPathnameForSection(pathname);
    setExpandedSection(getSectionForPathname(pathname));
  }

  const handleToggleSection = (sectionTitle: string) => {
    setExpandedSection((current) =>
      current === sectionTitle ? null : sectionTitle,
    );
  };

  const navSections = isGoogleUser
    ? NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.href || !GOOGLE_BLOCKED_ROUTES.includes(item.href),
        ),
      }))
    : NAV_SECTIONS;

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
        {navSections.map((section, sectionIndex) => {
          const sectionTitle = section.title;

          return (
            <div
              key={sectionTitle ?? `section-${sectionIndex}`}
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

              {sectionTitle ? (
                <SidebarSectionAccordion
                  title={sectionTitle}
                  items={section.items}
                  isExpanded={expandedSection === sectionTitle}
                  onToggle={() => handleToggleSection(sectionTitle)}
                  iconFontSize={iconFontSize}
                  pathname={pathname}
                />
              ) : (
                section.items.map((item) => {
                  const href = item.href ?? '#';
                  const isActive = isRouteActive(pathname, href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={href}
                      href={href}
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
                })
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
