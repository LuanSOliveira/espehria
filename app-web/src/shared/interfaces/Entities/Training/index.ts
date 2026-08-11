import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';
import { IImprovementDefectItem } from '../ImprovementDefectItem';
import { IProficiencyItem } from '../ProficiencyItem';
import { IKnowledgeItem } from '../KnowledgeItem';

export interface ITraining extends IEntity {
  name: string;
  description?: string | null;
  tags: ITag[];
  level: number;
  requirements: IEntityReference[];
  additionalAbilities: IEntityReference[];
  improvements: IImprovementDefectItem[];
  flaws: IImprovementDefectItem[];
  proficiencies: IProficiencyItem[];
  knowledges: IKnowledgeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ITrainingListItem {
  id: string;
  name: string;
  tags: ITag[];
  level: number;
}

export interface ITrainingListFilters {
  name?: string;
  level?: number;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
