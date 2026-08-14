import { IEntity } from '../Entity';
import { IEntityReference } from '../EntityReference';
import { ITag } from '../Tag';
import { IImprovementDefectItem } from '../ImprovementDefectItem';
import { IProficiencyItem } from '../ProficiencyItem';
import { IKnowledgeItem } from '../KnowledgeItem';

export interface IRaceCategory {
  id: string;
  name: string;
}

export interface IRaceListItem {
  id: string;
  referenceImageUrl?: string | null;
  name: string;
  category: IRaceCategory;
  tags: ITag[];
}

export interface IRace extends IEntity {
  name: string;
  category: IRaceCategory;
  referenceImageUrl?: string | null;
  description?: string | null;
  hitPoints: number;
  privateInformation?: string | null;
  tags: ITag[];
  characteristics: IEntityReference[];
  talents: IEntityReference[];
  improvements: IImprovementDefectItem[];
  flaws: IImprovementDefectItem[];
  proficiencies: IProficiencyItem[];
  knowledges: IKnowledgeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IRaceListFilters {
  name?: string;
  categoryId?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
