'use client';

import { useTraitTypesQuery } from '../useTraitTypesQuery';

/**
 * Resolve o id do registro de seed `'Armadura'` em `trait_types`. Único ponto
 * do código-fonte que compara por esse nome — qualquer consumidor futuro do
 * id do tipo "Armadura" deve reusar este hook em vez de repetir a comparação.
 */
export const useArmaduraTraitTypeId = () => {
  const { data: traitTypes, isLoading } = useTraitTypesQuery();

  const armaduraTraitTypeId = traitTypes?.find((t) => t.name === 'Armadura')?.id;

  return { armaduraTraitTypeId, isLoading };
};
