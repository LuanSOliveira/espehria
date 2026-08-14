import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IUser } from '../User';

export interface ICampaignListItem {
  id: string;
  referenceImageUrl?: string | null;
  name: string;
  tags: ITag[];
}

export interface ICampaignSection {
  id: string;
  label: string;
  description?: string | null;
  order: number;
}

export interface ICampaign extends IEntity {
  name: string;
  referenceImageUrl?: string | null;
  description?: string | null;
  tags: ITag[];
  sections: ICampaignSection[];
  allowedUsers: IUser[];
  createdBy: IUser;
  createdAt: string;
  updatedAt: string;
}

export interface ICampaignListFilters {
  name?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}

export interface ICampaignSheetListItem {
  id: string;
  name: string;
  referenceImage?: string | null;
  level: number;
  createdBy: IUser;
}
