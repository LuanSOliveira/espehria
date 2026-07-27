import {
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiFeather,
  FiHome,
  FiMapPin,
  FiSun,
  FiTag,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { MdOutlineFace } from 'react-icons/md';
import { IconType } from 'react-icons';
import { APP_ROUTES } from '@/shared/routes';

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
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
        label: 'Divindades',
        href: APP_ROUTES.private.divinities,
        icon: FiSun,
      },
      {
        label: 'Locais',
        href: APP_ROUTES.private.locations,
        icon: FiMapPin,
      },
      {
        label: 'Raças',
        href: APP_ROUTES.private.races,
        icon: MdOutlineFace,
      },
      {
        label: 'Personagens',
        href: APP_ROUTES.private.characters,
        icon: FiUser,
      },
      {
        label: 'Organizações',
        href: APP_ROUTES.private.organizations,
        icon: FiBriefcase,
      },
    ],
  },
  {
    title: 'História',
    items: [
      { label: 'Eras', href: APP_ROUTES.private.eras, icon: FiClock },
      { label: 'Eventos', href: APP_ROUTES.private.events, icon: FiCalendar },
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
