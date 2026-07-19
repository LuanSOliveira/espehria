'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError } from '@/shared/interfaces';

export interface UsePostEntityParams<TResponse, TPayload> {
  url: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (data: TResponse, payload: TPayload) => void;
  onError?: (error: AxiosError<IAxioDataError>) => void;
}

export const usePostEntity = <TResponse, TPayload>({
  url,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UsePostEntityParams<TResponse, TPayload>) => {
  const queryClient = useQueryClient();

  return useMutation<TResponse, AxiosError<IAxioDataError>, TPayload>({
    mutationFn: async (payload) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.post<TResponse>(url, payload);
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
