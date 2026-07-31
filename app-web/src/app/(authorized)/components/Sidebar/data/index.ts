import {
  FiActivity,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCloudLightning,
  FiCoffee,
  FiCrosshair,
  FiFeather,
  FiGitBranch,
  FiHome,
  FiLayers,
  FiMapPin,
  FiPackage,
  FiSettings,
  FiStar,
  FiSun,
  FiTag,
  FiTarget,
  FiTool,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiZap,
  FiCompass,
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
    items: [
      { label: 'Home', href: APP_ROUTES.private.home, icon: FiHome },
      {
        label: 'Campanhas',
        href: APP_ROUTES.private.campaigns,
        icon: FiCompass,
      },
    ],
  },
  {
    title: 'JOGO',
    items: [
      { label: 'Regras', href: APP_ROUTES.private.rules, icon: FiBookOpen },
      { label: 'Perícias', href: APP_ROUTES.private.skills, icon: FiZap },
      {
        label: 'Condições',
        href: APP_ROUTES.private.conditions,
        icon: FiActivity,
      },
    ],
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
      {
        label: 'Utilitários',
        href: APP_ROUTES.private.utilities,
        icon: FiSettings,
      },
    ],
  },
  {
    title: 'Habilidades',
    items: [
      {
        label: 'Treinamentos',
        href: APP_ROUTES.private.trainings,
        icon: FiTrendingUp,
      },
      {
        label: 'Talentos',
        href: APP_ROUTES.private.talents,
        icon: FiStar,
      },
      {
        label: 'Características',
        href: APP_ROUTES.private.characteristics,
        icon: FiLayers,
      },
      {
        label: 'Técnicas',
        href: APP_ROUTES.private.techniques,
        icon: FiTarget,
      },
      {
        label: 'Magias',
        href: APP_ROUTES.private.spells,
        icon: FiCloudLightning,
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
