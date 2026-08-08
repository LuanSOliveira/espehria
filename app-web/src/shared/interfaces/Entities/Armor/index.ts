import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { ICurrency } from '../Currency';

export interface IArmorListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  price?: number | null;
  currency?: ICurrency | null;
  tags: ITag[];
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
}

export interface IArmorListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
