export interface IProficiencyGradation {
  id: string;
  name: string;
  /** Magnitude usada para comparar graduações entre si (não usar para bônus). */
  level: number;
  /** Valor numérico somado ao modificador do atributo-chave no cálculo de perícia. */
  bonus: number;
}
