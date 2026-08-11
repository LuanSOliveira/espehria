'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetAbilitiesMutationResult } from '@/shared/interfaces';

export interface UseEmptySheetTrainingSlotMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (data: ISheetAbilitiesMutationResult, slotIndex: number) => void;
  onError?: (error: AxiosError<IAxioDataError>, slotIndex: number) => void;
}

/**
 * Esvazia um slot de treinamento preenchido da ficha (`DELETE
 * /sheets/:id/trainings/slots/:slotIndex/training`) — mesmo espírito de
 * `useFillSheetTrainingSlotMutation`.
 */
export const useEmptySheetTrainingSlotMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseEmptySheetTrainingSlotMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<ISheetAbilitiesMutationResult, AxiosError<IAxioDataError>, number>({
    mutationFn: async (slotIndex) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.delete<ISheetAbilitiesMutationResult>(
        `/sheets/${sheetId}/trainings/slots/${slotIndex}/training`,
      );
      return data;
    },
    onSuccess: (data, slotIndex) => {
      invalidateQueryKeys?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(data, slotIndex);
    },
    onError,
  });
};
