import { ValueTransformer } from 'typeorm';

// O driver `pg`/TypeORM retorna colunas `numeric` como `string` por padrão, para
// não perder precisão. Sem esse transformer, o DTO de resposta devolveria "12.5"
// em vez de 12.5 para colunas `numeric` (ex.: `volume`/`distanceMeters` em Weapon).
export const DecimalTransformer: ValueTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value === null ? null : parseFloat(value),
};
