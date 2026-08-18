import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { ICurrency } from '../Currency';
import { IEmbeddedEffect } from '../EmbeddedEffect';

export interface IShieldListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  price?: number | null;
  currency?: ICurrency | null;
  tags: ITag[];
  armorClassBonus?: number | null;
  hardness?: number | null;
  hitPoints?: number | null;
  breakThreshold?: number | null;
}

export interface IShield extends IEntity {
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
  armorClassBonus?: number | null;
  speedPenaltyMeters?: number | null;
  hardness?: number | null;
  hitPoints?: number | null;
  breakThreshold?: number | null;
  enchantments: IEmbeddedEffect[];
  enhancements: IEmbeddedEffect[];
}

export interface IShieldListFilters {
  name?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
