import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface ISpellListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  tags: ITag[];
}

export interface ISpell extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface ISpellListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
