'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError } from '@/shared/interfaces';

export interface UsePutEntityParams<TResponse, TPayload> {
  url: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (data: TResponse, payload: TPayload) => void;
  onError?: (error: AxiosError<IAxioDataError>) => void;
}

export const usePutEntity = <TResponse, TPayload>({
  url,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UsePutEntityParams<TResponse, TPayload>) => {
  const queryClient = useQueryClient();

  return useMutation<TResponse, AxiosError<IAxioDataError>, TPayload>({
    mutationFn: async (payload) => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.put<TResponse>(url, payload);
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
