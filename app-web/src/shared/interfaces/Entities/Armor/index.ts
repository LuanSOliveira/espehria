import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { ICurrency } from '../Currency';
import { IArmorCategory } from '../ArmorCategory';
import { ITrait } from '../Trait';

export interface IArmorListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  price?: number | null;
  currency?: ICurrency | null;
  tags: ITag[];
  traits: ITrait[];
}

export interface IArmor extends IEntity {
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
  armorCategory?: IArmorCategory | null;
  armorClassBonus?: number | null;
  dexterityModifierLimit?: number | null;
  strength?: number | null;
  checkPenalty?: number | null;
  speedPenaltyMeters?: number | null;
  traits: ITrait[];
}

export interface IArmorListFilters {
  name?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
