import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEraSummary } from '../Era';

export interface IEventListItem {
  id: string;
  referenceImageUrl?: string | null;
  name: string;
  startYear?: string | null;
  endYear?: string | null;
  era: IEraSummary | null;
  tags: ITag[];
}

export interface IEvent extends IEntity {
  name: string;
  referenceImageUrl?: string | null;
  startYear?: string | null;
  endYear?: string | null;
  description?: string | null;
  era: IEraSummary | null;
  tags: ITag[];
  createdAt: string;
  updatedAt: string;
}

export interface IEventListFilters {
  name?: string;
  eraId?: string;
  startYear?: string;
  endYear?: string;
  page?: number;
  perPage?: number;
}
