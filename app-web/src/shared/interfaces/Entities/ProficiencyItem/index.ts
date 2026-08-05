import { IProficiencyProperty } from '../ProficiencyProperty';
import { IProficiencyGradation } from '../ProficiencyGradation';

export interface IProficiencyItem {
  /**
   * Identificador do registro real em proficiencies. Ao ser criado localmente
   * no modal antes do submit do formulário, usa um uuid local descartável,
   * mesmo espírito de IImprovementDefectItem.
   */
  id: string;
  property: IProficiencyProperty;
  gradation: IProficiencyGradation;
}
