'use client';

import { useTraitTypesQuery } from '../useTraitTypesQuery';

/**
 * Resolve o id do registro de seed `'Arma'` em `trait_types`. Único ponto do
 * código-fonte que compara por esse nome — qualquer consumidor futuro do id do
 * tipo "Arma" deve reusar este hook em vez de repetir a comparação.
 */
export const useArmaTraitTypeId = () => {
  const { data: traitTypes, isLoading } = useTraitTypesQuery();

  const armaTraitTypeId = traitTypes?.find((t) => t.name === 'Arma')?.id;

  return { armaTraitTypeId, isLoading };
};
