import { IProficiencyGradation } from '../ProficiencyGradation';

export interface IKnowledgeItem {
  /**
   * Identificador do registro real em knowledges. Ao ser criado localmente
   * no modal antes do submit do formulário, usa um uuid local descartável,
   * mesmo espírito de IProficiencyItem.
   */
  id: string;
  title: string;
  gradation: IProficiencyGradation;
  /**
   * Indica se este saber permite anotações livres na ficha (define a
   * permissão no saber original). Sempre preenchido pelo modal de
   * cadastro/edição, com `false` como padrão quando não marcado.
   */
  editable: boolean;
}
