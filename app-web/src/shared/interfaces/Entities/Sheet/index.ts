import { IEntity } from '../Entity';
import { ICharacterRace } from '../Character';
import { IUser } from '../User';

export interface ISheetListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  campaign?: { id: string; name: string } | null;
}

export interface ISheet extends IEntity {
  name: string;
  referenceImage?: string | null;
  level: number;
  campaign?: { id: string; name: string } | null;
  race?: ICharacterRace | null;
  createdBy: IUser;
  createdAt: string;
  updatedAt: string;
}

export interface ISheetListFilters {
  name?: string;
  campaignId?: string;
  page?: number;
  perPage?: number;
}

export interface ISheetCampaignOption {
  id: string;
  name: string;
}
