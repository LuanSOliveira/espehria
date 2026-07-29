import Link from 'next/link';
import { Collapse } from '@mui/material';
import { FiChevronDown } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { APP_COLORS } from '@/shared/constants';
import { NavItem } from '../../data';

export interface SidebarSectionAccordionProps {
  title: string;
  items: NavItem[];
  isExpanded: boolean;
  onToggle: () => void;
  iconFontSize: number;
  pathname: string;
}

export const SidebarSectionAccordion = ({
  title,
  items,
  isExpanded,
  onToggle,
  iconFontSize,
  pathname,
}: SidebarSectionAccordionProps) => {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center justify-between rounded py-1.5 px-3.5"
      >
        <Label
          component="span"
          sx={{
            color: APP_COLORS.gold,
            margin: 0,
          }}
        >
          {title}
        </Label>
        <FiChevronDown
          className="shrink-0 text-gold"
          style={{
            fontSize: iconFontSize,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease-in-out',
          }}
        />
      </button>

      <Collapse in={isExpanded}>
        <div className="flex flex-col gap-1">
          {items.map((item) => {
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
      </Collapse>
    </div>
  );
};
