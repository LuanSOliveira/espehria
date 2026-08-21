'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetInventoryMutationResult } from '@/shared/interfaces';

export interface UseEquipSheetInventoryItemMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (data: ISheetInventoryMutationResult, itemId: string) => void;
  onError?: (error: AxiosError<IAxioDataError>, itemId: string) => void;
}

/**
 * Marca um item de inventário da ficha como equipado (`PUT
 * /sheets/:id/inventory-items/:itemId/equip`, idempotente no backend) — não
 * reaproveita `usePutEntity` porque o `itemId` faz parte da URL e varia a
 * cada chamada, mesmo espírito de `useFillSheetTrainingSlotMutation`.
 */
export const useEquipSheetInventoryItemMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseEquipSheetInventoryItemMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<
    ISheetInventoryMutationResult,
    AxiosError<IAxioDataError>,
    string
  >({
    mutationFn: async (itemId) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.put<ISheetInventoryMutationResult>(
        `/sheets/${sheetId}/inventory-items/${itemId}/equip`,
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
