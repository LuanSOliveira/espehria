import { WeaponHands, WeaponStyle } from '@/shared/interfaces';

export interface WeaponHandsOption {
  value: WeaponHands;
  label: string;
}

export const WEAPON_HANDS_OPTIONS: WeaponHandsOption[] = [
  { value: '1', label: '1 Mão' },
  { value: '2', label: '2 Mãos' },
];

export interface WeaponStyleOption {
  value: WeaponStyle;
  label: string;
}

export const WEAPON_STYLE_OPTIONS: WeaponStyleOption[] = [
  { value: 'melee', label: 'Corpo a Corpo' },
  { value: 'ranged', label: 'A Distância' },
];
