import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';

export interface ISpellListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  tags: ITag[];
  level: number;
}

export interface ISpell extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  tags: ITag[];
  level: number;
  improvedFrom: IEntityReference[];
  requirements: IEntityReference[];
  createdAt: string;
  updatedAt: string;
}

export interface ISpellListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
