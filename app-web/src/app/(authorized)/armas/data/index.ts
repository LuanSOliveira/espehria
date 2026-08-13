import { WeaponDamageDie, WeaponHands, WeaponStyle } from '@/shared/interfaces';

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

export interface WeaponDamageDieOption {
  value: WeaponDamageDie;
  label: string;
}

export const WEAPON_DAMAGE_DIE_OPTIONS: WeaponDamageDieOption[] = [
  { value: 'd2', label: 'd2' },
  { value: 'd4', label: 'd4' },
  { value: 'd6', label: 'd6' },
  { value: 'd8', label: 'd8' },
  { value: 'd10', label: 'd10' },
  { value: 'd12', label: 'd12' },
  { value: 'd20', label: 'd20' },
  { value: 'd100', label: 'd100' },
];
