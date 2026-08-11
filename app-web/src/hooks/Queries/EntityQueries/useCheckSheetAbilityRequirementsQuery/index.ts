'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import {
  IAxioDataError,
  ISheetAbilityBucketType,
  ISheetAbilityRequirementCheck,
} from '@/shared/interfaces';

export interface UseCheckSheetAbilityRequirementsQueryParams {
  sheetId: string;
  entityType: ISheetAbilityBucketType;
  ids: string[];
  enabled?: boolean;
}

/**
 * Avalia, em lote, presença e requisitos de itens do catálogo (Característica/
 * Treinamento/Talento) frente ao estado atual da ficha
 * (`POST /sheets/:id/abilities/requirement-checks`). Usado por
 * `SheetAbilitySelectionModal` para desabilitar "Adicionar" por item já
 * presente ou requisitos não atendidos. Implementado como `useQuery` (não
 * `usePostEntity`) porque, apesar do verbo HTTP, é uma leitura idempotente —
 * mesmo espírito de `useTagOptionsQuery` reaproveitando cache por chave.
 */
export const useCheckSheetAbilityRequirementsQuery = ({
  sheetId,
  entityType,
  ids,
  enabled = true,
}: UseCheckSheetAbilityRequirementsQueryParams) => {
  return useQuery<ISheetAbilityRequirementCheck[], AxiosError<IAxioDataError>>({
    queryKey: [
      `/sheets/${sheetId}/abilities/requirement-checks`,
      entityType,
      ids,
    ],
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.post<ISheetAbilityRequirementCheck[]>(
        `/sheets/${sheetId}/abilities/requirement-checks`,
        { items: ids.map((id) => ({ entityType, id })) },
      );
      return data;
    },
    enabled: enabled && ids.length > 0,
    placeholderData: (previousData) => previousData,
  });
};
