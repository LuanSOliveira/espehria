'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetInventoryMutationResult } from '@/shared/interfaces';

export interface IncreaseSheetInventoryItemQuantityPayload {
  itemId: string;
  quantity: number;
}

export interface UseIncreaseSheetInventoryItemQuantityMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (
    data: ISheetInventoryMutationResult,
    payload: IncreaseSheetInventoryItemQuantityPayload,
  ) => void;
  onError?: (
    error: AxiosError<IAxioDataError>,
    payload: IncreaseSheetInventoryItemQuantityPayload,
  ) => void;
}

/**
 * Aumenta a quantidade de um item já existente no inventário da ficha
 * (`POST /sheets/:id/inventory-items/:itemId/increase`) — não reaproveita
 * `usePostEntity` porque o `itemId` faz parte da URL e varia a cada chamada,
 * mesmo espírito de `useRemoveSheetInventoryItemMutation`.
 */
export const useIncreaseSheetInventoryItemQuantityMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseIncreaseSheetInventoryItemQuantityMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<
    ISheetInventoryMutationResult,
    AxiosError<IAxioDataError>,
    IncreaseSheetInventoryItemQuantityPayload
  >({
    mutationFn: async ({ itemId, quantity }) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.post<ISheetInventoryMutationResult>(
        `/sheets/${sheetId}/inventory-items/${itemId}/increase`,
        { quantity },
      );
      return data;
    },
    onSuccess: (data, payload) => {
      invalidateQueryKeys?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(data, payload);
    },
    onError,
  });
};
