'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError } from '@/shared/interfaces';

export interface UseGetEntityByIdParams {
  url: string;
  enabled?: boolean;
}

export const useGetEntityById = <TItem>({
  url,
  enabled = true,
}: UseGetEntityByIdParams) => {
  return useQuery<TItem, AxiosError<IAxioDataError>>({
    queryKey: [url],
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<TItem>(url);
      return data;
    },
    enabled,
  });
};
