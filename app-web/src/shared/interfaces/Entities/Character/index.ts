import { IEntity } from '../Entity';
import { IFamilySummary } from '../Family';
import { IOrganizationSummary } from '../Organization';
import { ITag } from '../Tag';

export interface ICharacterSummary {
  id: string;
  name: string;
  referenceImage?: string | null;
}

export interface ICharacterRace {
  id: string;
  name: string;
}

export interface ICharacterListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  isDead: boolean;
  race?: ICharacterRace | null;
  tags: ITag[];
}

export interface ICharacter extends IEntity {
  name: string;
  referenceImage?: string | null;
  description?: string | null;
  privateInformation?: string | null;
  isDead: boolean;
  race?: ICharacterRace | null;
  tags: ITag[];
  family?: IFamilySummary | null;
  secondaryFamily?: IFamilySummary | null;
  /**
   * Organizações das quais o personagem participa como membro. Campo
   * derivado/somente leitura, calculado pelo backend a partir dos vínculos de
   * membro de organização — não faz parte do formulário de cadastro.
   */
  organizations: IOrganizationSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ICharacterListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
