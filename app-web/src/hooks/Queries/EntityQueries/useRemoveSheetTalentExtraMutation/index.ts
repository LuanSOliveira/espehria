'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetAbilitiesMutationResult } from '@/shared/interfaces';

export interface UseRemoveSheetTalentExtraMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (data: ISheetAbilitiesMutationResult, talentId: string) => void;
  onError?: (error: AxiosError<IAxioDataError>, talentId: string) => void;
}

/**
 * Remove um talento extra da ficha (`DELETE
 * /sheets/:id/talents/extras/:talentId`) — mesmo espírito de
 * `useRemoveSheetCharacteristicExtraMutation`.
 */
export const useRemoveSheetTalentExtraMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseRemoveSheetTalentExtraMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<ISheetAbilitiesMutationResult, AxiosError<IAxioDataError>, string>({
    mutationFn: async (talentId) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.delete<ISheetAbilitiesMutationResult>(
        `/sheets/${sheetId}/talents/extras/${talentId}`,
      );
      return data;
    },
    onSuccess: (data, talentId) => {
      invalidateQueryKeys?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(data, talentId);
    },
    onError,
  });
};
