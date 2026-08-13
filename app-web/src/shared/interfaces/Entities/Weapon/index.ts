import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { ICurrency } from '../Currency';
import { ISizeGrade } from '../SizeGrade';
import { ITrait } from '../Trait';
import { IDamageType } from '../DamageType';

export type WeaponHands = '1' | '2';
export type WeaponStyle = 'melee' | 'ranged';
export type WeaponDamageDie =
  | 'd2'
  | 'd4'
  | 'd6'
  | 'd8'
  | 'd10'
  | 'd12'
  | 'd20'
  | 'd100';

export interface IWeaponListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  price?: number | null;
  currency?: ICurrency | null;
  tags: ITag[];
  traits: ITrait[];
}

export interface IWeapon extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: ICurrency | null;
  privateInformation?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
  nickname?: string | null;
  volume?: number | null;
  sizeGrade?: ISizeGrade | null;
  hands?: WeaponHands | null;
  weaponStyle?: WeaponStyle | null;
  traits: ITrait[];
  damageValue?: number | null;
  damageDie?: WeaponDamageDie | null;
  damageType?: IDamageType | null;
  magicalDamage: boolean;
  distanceMeters?: number | null;
  usesAmmunition: boolean;
  reloadActions?: number | null;
}

export interface IWeaponListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
