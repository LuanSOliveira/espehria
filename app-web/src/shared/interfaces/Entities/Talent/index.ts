import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';
import { IImprovementDefectItem } from '../ImprovementDefectItem';
import { IProficiencyItem } from '../ProficiencyItem';
import { IKnowledgeItem } from '../KnowledgeItem';

export interface ITalent extends IEntity {
  name: string;
  description?: string | null;
  tags: ITag[];
  level: number;
  improvedFrom: IEntityReference[];
  requirements: IEntityReference[];
  additionalAbilities: IEntityReference[];
  improvements: IImprovementDefectItem[];
  flaws: IImprovementDefectItem[];
  proficiencies: IProficiencyItem[];
  knowledges: IKnowledgeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ITalentListItem {
  id: string;
  name: string;
  tags: ITag[];
  level: number;
}

export interface ITalentListFilters {
  name?: string;
  level?: number;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
