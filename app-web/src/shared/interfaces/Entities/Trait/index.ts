import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { ITraitType } from '../TraitType';

export interface ITraitListItem {
  id: string;
  name: string;
  traitType?: ITraitType | null;
  tags: ITag[];
}

export interface ITrait extends IEntity {
  name: string;
  traitType?: ITraitType | null;
  description?: string | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface ITraitListFilters {
  name?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
