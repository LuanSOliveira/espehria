'use client';

import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError } from '@/shared/interfaces';

export interface UseDeleteEntityParams<TResponse = void> {
  url: string;
  invalidateQueryKeys?: QueryKey[];
  onSuccess?: (data: TResponse) => void;
  onError?: (error: AxiosError<IAxioDataError>) => void;
}

export const useDeleteEntity = <TResponse = void>({
  url,
  invalidateQueryKeys,
  onSuccess,
  onError,
}: UseDeleteEntityParams<TResponse>) => {
  const queryClient = useQueryClient();

  return useMutation<TResponse, AxiosError<IAxioDataError>, void>({
    mutationFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.delete<TResponse>(url);
      return data;
    },
    onSuccess: (data) => {
      invalidateQueryKeys?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(data);
    },
    onError,
  });
};
