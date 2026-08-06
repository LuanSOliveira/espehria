'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheet } from '@/shared/interfaces';

export interface UpdateSheetKnowledgeNotePayload {
  knowledgeId: string;
  note: string;
}

export interface UseUpdateSheetKnowledgeNoteMutationParams {
  sheetId: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (
    data: ISheet,
    payload: UpdateSheetKnowledgeNotePayload,
  ) => void;
  onError?: (
    error: AxiosError<IAxioDataError>,
    payload: UpdateSheetKnowledgeNotePayload,
  ) => void;
}

/**
 * Salva (autosave) a nota de um saber da ficha. Não é um CRUD padrão (o id do
 * saber faz parte da URL e varia a cada chamada), por isso não reaproveita
 * `usePutEntity` — mesmo espírito de `useResolveProficiencyAdjustmentMutation`.
 */
export const useUpdateSheetKnowledgeNoteMutation = ({
  sheetId,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseUpdateSheetKnowledgeNoteMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<
    ISheet,
    AxiosError<IAxioDataError>,
    UpdateSheetKnowledgeNotePayload
  >({
    mutationFn: async ({ knowledgeId, note }) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.put<ISheet>(
        `/sheets/${sheetId}/knowledge-notes/${knowledgeId}`,
        { note },
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
