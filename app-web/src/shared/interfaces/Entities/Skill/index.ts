import { IEntity } from '../Entity';
import { ITag } from '../Tag';

export interface ISkillSection {
  id: string;
  label: string;
  description?: string | null;
  order: number;
}

export interface ISkill extends IEntity {
  name: string;
  description?: string | null;
  tags: ITag[];
  sections: ISkillSection[];
  createdAt: string;
  updatedAt: string;
}

export interface ISkillListItem {
  id: string;
  name: string;
}

export interface ISkillListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
