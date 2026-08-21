import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { ICurrency } from '../Currency';

export interface IMaterialListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  price?: number | null;
  currency?: ICurrency | null;
  tags: ITag[];
  volume?: number | null;
}

export interface IMaterial extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: ICurrency | null;
  privateInformation?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
  volume?: number | null;
}

export interface IMaterialListFilters {
  name?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
