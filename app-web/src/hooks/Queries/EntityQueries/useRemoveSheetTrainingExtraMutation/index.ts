'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetAbilitiesMutationResult } from '@/shared/interfaces';

export interface UseRemoveSheetTrainingExtraMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (data: ISheetAbilitiesMutationResult, trainingId: string) => void;
  onError?: (error: AxiosError<IAxioDataError>, trainingId: string) => void;
}

/**
 * Remove um treinamento extra da ficha (`DELETE
 * /sheets/:id/trainings/extras/:trainingId`) — mesmo espírito de
 * `useRemoveSheetCharacteristicExtraMutation`.
 */
export const useRemoveSheetTrainingExtraMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseRemoveSheetTrainingExtraMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<ISheetAbilitiesMutationResult, AxiosError<IAxioDataError>, string>({
    mutationFn: async (trainingId) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.delete<ISheetAbilitiesMutationResult>(
        `/sheets/${sheetId}/trainings/extras/${trainingId}`,
      );
      return data;
    },
    onSuccess: (data, trainingId) => {
      invalidateQueryKeys?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(data, trainingId);
    },
    onError,
  });
};
