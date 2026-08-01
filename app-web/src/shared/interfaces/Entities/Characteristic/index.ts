import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';

export interface ICharacteristic extends IEntity {
  name: string;
  description?: string | null;
  tags: ITag[];
  level: number;
  improvedFrom: IEntityReference[];
  requirements: IEntityReference[];
  additionalAbilities: IEntityReference[];
  createdAt: string;
  updatedAt: string;
}

export interface ICharacteristicListItem {
  id: string;
  name: string;
  tags: ITag[];
  level: number;
}

export interface ICharacteristicListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
