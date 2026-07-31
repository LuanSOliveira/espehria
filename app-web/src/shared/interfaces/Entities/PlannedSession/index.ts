import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface IPlannedSessionListItem {
  id: string;
  name: string;
  tags: ITag[];
}

export interface IPlannedSessionSection {
  id: string;
  label: string;
  description?: string | null;
  order: number;
}

export interface IPlannedSession extends IEntity {
  name: string;
  introduction?: string | null;
  tags: ITag[];
  sections: IPlannedSessionSection[];
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPlannedSessionListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
