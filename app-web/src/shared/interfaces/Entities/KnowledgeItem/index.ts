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
}
