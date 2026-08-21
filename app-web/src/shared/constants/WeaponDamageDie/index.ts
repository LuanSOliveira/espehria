import { WeaponDamageDie } from '@/shared/interfaces';

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
