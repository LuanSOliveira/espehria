'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Collapse } from '@mui/material';
import { FiChevronDown } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS } from '@/shared/constants';
import { NavItem } from '../../data';

export interface SidebarNavItemAccordionProps {
  label: string;
  icon: IconType;
  items: NavItem[];
  pathname: string;
  iconFontSize: number;
}

const isChildActive = (pathname: string, items: NavItem[]): boolean =>
  items.some((item) => !!item.href && pathname === item.href);

export const SidebarNavItemAccordion = ({
  label,
  icon: Icon,
  items,
  pathname,
  iconFontSize,
}: SidebarNavItemAccordionProps) => {
  const [isExpanded, setIsExpanded] = useState(() =>
    isChildActive(pathname, items),
  );

  useEffect(() => {
    setIsExpanded(isChildActive(pathname, items));
  }, [pathname, items]);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded border border-transparent bg-transparent py-2.5 px-3.5 transition-colors duration-150 ease-in-out hover:bg-gold/15"
      >
        <div className="flex items-center gap-3">
          <Icon
            className="shrink-0 text-gold-soft"
            style={{ fontSize: iconFontSize }}
          />
          <Label
            component="span"
            sx={{ margin: 0, color: APP_COLORS.goldSoft }}
          >
            {label}
          </Label>
        </div>
        <FiChevronDown
          className="shrink-0 text-gold-soft"
          style={{
            fontSize: iconFontSize,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease-in-out',
          }}
        />
      </button>

      <Collapse in={isExpanded}>
        <div className="flex flex-col gap-1 pl-4">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const ItemIcon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href ?? '#'}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className={`flex items-center gap-3 rounded border py-2.5 px-3.5 transition-colors duration-150 ease-in-out hover:bg-gold/15 ${
                    isActive
                      ? 'border-gold bg-gold/25'
                      : 'border-transparent bg-transparent'
                  }`}
                >
                  <ItemIcon
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
      </Collapse>
    </div>
  );
};
