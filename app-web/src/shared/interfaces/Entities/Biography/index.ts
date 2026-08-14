import { IEntity } from '../Entity';
import { ITag } from '../Tag';
import { IEntityReference } from '../EntityReference';
import { IImprovementDefectItem } from '../ImprovementDefectItem';
import { IProficiencyItem } from '../ProficiencyItem';
import { IKnowledgeItem } from '../KnowledgeItem';

export interface IBiography extends IEntity {
  name: string;
  description?: string | null;
  imageReference?: string | null;
  tags: ITag[];
  improvements: IImprovementDefectItem[];
  proficiencies: IProficiencyItem[];
  knowledges: IKnowledgeItem[];
  additionalAbilities: IEntityReference[];
  createdAt: string;
  updatedAt: string;
}

export interface IBiographyListItem {
  id: string;
  name: string;
  imageReference?: string | null;
  tags: ITag[];
}

export interface IBiographyListFilters {
  name?: string;
  tagIds?: string[];
  page?: number;
  perPage?: number;
}
