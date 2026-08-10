import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';
import { IImprovementDefectItem } from '../ImprovementDefectItem';
import { IProficiencyItem } from '../ProficiencyItem';
import { IKnowledgeItem } from '../KnowledgeItem';

export interface ICharacteristic extends IEntity {
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

export interface ICharacteristicListItem {
  id: string;
  name: string;
  tags: ITag[];
  level: number;
}

export interface ICharacteristicListFilters {
  name?: string;
  level?: number;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
