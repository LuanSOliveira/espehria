'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetAbilitiesMutationResult } from '@/shared/interfaces';

export interface FillSheetTrainingSlotPayload {
  slotIndex: number;
  trainingId: string;
}

export interface UseFillSheetTrainingSlotMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (
    data: ISheetAbilitiesMutationResult,
    payload: FillSheetTrainingSlotPayload,
  ) => void;
  onError?: (
    error: AxiosError<IAxioDataError>,
    payload: FillSheetTrainingSlotPayload,
  ) => void;
}

/**
 * Preenche um slot de treinamento vazio da ficha (`PUT
 * /sheets/:id/trainings/slots/:slotIndex/training`). Não é um CRUD padrão (o
 * índice do slot faz parte da URL e varia a cada chamada), por isso não
 * reaproveita `usePutEntity` — mesmo espírito de
 * `useResolveProficiencyAdjustmentMutation`.
 */
export const useFillSheetTrainingSlotMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseFillSheetTrainingSlotMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<
    ISheetAbilitiesMutationResult,
    AxiosError<IAxioDataError>,
    FillSheetTrainingSlotPayload
  >({
    mutationFn: async ({ slotIndex, trainingId }) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.put<ISheetAbilitiesMutationResult>(
        `/sheets/${sheetId}/trainings/slots/${slotIndex}/training`,
        { trainingId },
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
