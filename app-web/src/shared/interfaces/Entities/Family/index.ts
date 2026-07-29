import { ICharacterSummary } from '../Character';
import { IEntity } from '../Entity';
import { ITag } from '../Tag';

/**
 * Valores exatos do enum `FamilyClassification` do backend
 * (app-api/src/modules/families/enums/family-classification.enum.ts) — minúsculos,
 * não os rótulos pt-BR exibidos na UI (ver FAMILY_CLASSIFICATION_OPTIONS).
 */
export type FamilyClassification = 'royalty' | 'nobility' | 'commoner';

/**
 * Valores exatos do enum `FamilyRelationshipType` do backend
 * (app-api/src/modules/families/enums/family-relationship-type.enum.ts).
 */
export type FamilyRelationshipType = 'parent' | 'spouse';

export interface IFamilySummary {
  id: string;
  name: string;
  referenceImage?: string | null;
}

export interface IFamilyMember {
  id: string;
  character: ICharacterSummary;
  positionX: number;
  positionY: number;
}

export interface IFamilyRelationship {
  id: string;
  type: FamilyRelationshipType;
  sourceCharacter: ICharacterSummary;
  targetCharacter: ICharacterSummary;
}

export interface IFamilyListItem {
  id: string;
  referenceImage?: string | null;
  name: string;
  classification: FamilyClassification;
  tags: ITag[];
}

export interface IFamily extends IEntity {
  name: string;
  referenceImage?: string | null;
  classification: FamilyClassification;
  tags: ITag[];
  description?: string | null;
  members: IFamilyMember[];
  relationships: IFamilyRelationship[];
  /**
   * Personagens cuja família primária ou secundária é esta família, mas que ainda
   * não possuem card posicionado na árvore. Campo derivado/somente leitura,
   * calculado pelo backend — não faz parte do formulário de cadastro. Usado pelo
   * FamilyCreateForm para hidratar o quadro com os cards "soltos" do fluxo inverso.
   */
  looseCharacters: ICharacterSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface IFamilyListFilters {
  name?: string;
  page?: number;
  perPage?: number;
}
