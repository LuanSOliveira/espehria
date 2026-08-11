'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetAbilitiesMutationResult } from '@/shared/interfaces';

export interface UseRemoveSheetCharacteristicExtraMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (
    data: ISheetAbilitiesMutationResult,
    characteristicId: string,
  ) => void;
  onError?: (
    error: AxiosError<IAxioDataError>,
    characteristicId: string,
  ) => void;
}

/**
 * Remove uma característica extra da ficha (`DELETE
 * /sheets/:id/characteristics/extras/:characteristicId`). Não é um CRUD
 * padrão (o id da característica faz parte da URL e varia a cada chamada),
 * por isso não reaproveita `useDeleteEntity` — mesmo espírito de
 * `useResolveProficiencyAdjustmentMutation`.
 */
export const useRemoveSheetCharacteristicExtraMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseRemoveSheetCharacteristicExtraMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<ISheetAbilitiesMutationResult, AxiosError<IAxioDataError>, string>({
    mutationFn: async (characteristicId) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.delete<ISheetAbilitiesMutationResult>(
        `/sheets/${sheetId}/characteristics/extras/${characteristicId}`,
      );
      return data;
    },
    onSuccess: (data, characteristicId) => {
      invalidateQueryKeys?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(data, characteristicId);
    },
    onError,
  });
};
