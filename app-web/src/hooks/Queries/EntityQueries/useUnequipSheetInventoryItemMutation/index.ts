'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetInventoryMutationResult } from '@/shared/interfaces';

export interface UseUnequipSheetInventoryItemMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (data: ISheetInventoryMutationResult, itemId: string) => void;
  onError?: (error: AxiosError<IAxioDataError>, itemId: string) => void;
}

/**
 * Marca um item de inventário da ficha como não equipado (`PUT
 * /sheets/:id/inventory-items/:itemId/unequip`, idempotente no backend) —
 * mesmo espírito de `useEquipSheetInventoryItemMutation`.
 */
export const useUnequipSheetInventoryItemMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseUnequipSheetInventoryItemMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<
    ISheetInventoryMutationResult,
    AxiosError<IAxioDataError>,
    string
  >({
    mutationFn: async (itemId) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.put<ISheetInventoryMutationResult>(
        `/sheets/${sheetId}/inventory-items/${itemId}/unequip`,
      );
      return data;
    },
    onSuccess: (data, itemId) => {
      invalidateQueryKeys?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(data, itemId);
    },
    onError,
  });
};
