import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface ITechniqueListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  tags: ITag[];
}

export interface ITechnique extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface ITechniqueListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
