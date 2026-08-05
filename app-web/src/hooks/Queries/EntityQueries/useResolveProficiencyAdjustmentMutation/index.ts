'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheet } from '@/shared/interfaces';

export interface ResolveProficiencyAdjustmentPayload {
  adjustmentId: string;
  propertyId: string;
}

export interface UseResolveProficiencyAdjustmentMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (
    data: ISheet,
    payload: ResolveProficiencyAdjustmentPayload,
  ) => void;
  onError?: (
    error: AxiosError<IAxioDataError>,
    payload: ResolveProficiencyAdjustmentPayload,
  ) => void;
}

/**
 * Resolve um conflito de proficiência pendente, escolhendo uma propriedade
 * substituta. Não é um CRUD padrão (o id do ajuste faz parte da URL e varia a
 * cada chamada), por isso não reaproveita `usePutEntity` — a URL é montada
 * dentro de `mutationFn` a partir do payload de cada chamada.
 */
export const useResolveProficiencyAdjustmentMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseResolveProficiencyAdjustmentMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<
    ISheet,
    AxiosError<IAxioDataError>,
    ResolveProficiencyAdjustmentPayload
  >({
    mutationFn: async ({ adjustmentId, propertyId }) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.put<ISheet>(
        `/sheets/${sheetId}/proficiency-adjustments/${adjustmentId}`,
        { propertyId },
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
