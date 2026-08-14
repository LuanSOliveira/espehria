import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IAttribute } from '../Attribute';

export interface ISkillSection {
  id: string;
  label: string;
  description?: string | null;
  order: number;
}

export interface ISkill extends IEntity {
  name: string;
  description?: string | null;
  keyAttribute: IAttribute;
  tags: ITag[];
  sections: ISkillSection[];
  createdAt: string;
  updatedAt: string;
}

export interface ISkillListItem {
  id: string;
  name: string;
  keyAttribute: IAttribute;
}

export interface ISkillListFilters {
  name?: string;
  keyAttributeId?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
