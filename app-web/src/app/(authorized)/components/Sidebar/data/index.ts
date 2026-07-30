import {
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCoffee,
  FiCrosshair,
  FiFeather,
  FiGitBranch,
  FiHome,
  FiMapPin,
  FiPackage,
  FiSun,
  FiTag,
  FiTool,
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
      {
        label: 'Famílias',
        href: APP_ROUTES.private.families,
        icon: FiGitBranch,
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
    title: 'Itens',
    items: [
      {
        label: 'Equipamentos',
        href: APP_ROUTES.private.equipment,
        icon: FiTool,
      },
      {
        label: 'Materiais',
        href: APP_ROUTES.private.materials,
        icon: FiPackage,
      },
      {
        label: 'Consumíveis',
        href: APP_ROUTES.private.consumables,
        icon: FiCoffee,
      },
      {
        label: 'Munições',
        href: APP_ROUTES.private.ammunition,
        icon: FiCrosshair,
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
