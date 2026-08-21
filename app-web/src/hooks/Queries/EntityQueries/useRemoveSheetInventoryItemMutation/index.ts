'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetInventoryMutationResult } from '@/shared/interfaces';

export interface RemoveSheetInventoryItemPayload {
  itemId: string;
  quantity: number;
}

export interface UseRemoveSheetInventoryItemMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (
    data: ISheetInventoryMutationResult,
    payload: RemoveSheetInventoryItemPayload,
  ) => void;
  onError?: (
    error: AxiosError<IAxioDataError>,
    payload: RemoveSheetInventoryItemPayload,
  ) => void;
}

/**
 * Remove quantidade parcial ou total de um item de inventário da ficha
 * (`POST /sheets/:id/inventory-items/:itemId/remove`) — não reaproveita
 * `usePostEntity` porque o `itemId` faz parte da URL e varia a cada chamada,
 * mesmo espírito de `useFillSheetTrainingSlotMutation`.
 */
export const useRemoveSheetInventoryItemMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseRemoveSheetInventoryItemMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<
    ISheetInventoryMutationResult,
    AxiosError<IAxioDataError>,
    RemoveSheetInventoryItemPayload
  >({
    mutationFn: async ({ itemId, quantity }) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.post<ISheetInventoryMutationResult>(
        `/sheets/${sheetId}/inventory-items/${itemId}/remove`,
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
