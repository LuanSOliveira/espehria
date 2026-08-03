import { IImprovementDefectType } from '../ImprovementDefectType';
import { IImprovementDefectProperty } from '../ImprovementDefectProperty';

export interface IImprovementDefectItem {
  /**
   * Identificador do registro real em improvement_flaws.
   */
  id: string;
  value: number;
  type: IImprovementDefectType;
  property: IImprovementDefectProperty;
}
