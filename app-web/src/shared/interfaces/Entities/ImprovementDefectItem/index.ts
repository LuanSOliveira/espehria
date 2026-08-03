import { IImprovementDefectType } from '../ImprovementDefectType';
import { IImprovementDefectProperty } from '../ImprovementDefectProperty';

export interface IImprovementDefectItem {
  value: number;
  type: IImprovementDefectType;
  property: IImprovementDefectProperty;
}
