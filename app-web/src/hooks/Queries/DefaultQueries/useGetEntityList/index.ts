'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IPaginatedResponse } from '@/shared/interfaces';

export interface UseGetEntityListParams<TFilters extends object = object> {
  url: string;
  filters?: TFilters;
  enabled?: boolean;
}

export const useGetEntityList = <TItem, TFilters extends object = object>({
  url,
  filters,
  enabled = true,
}: UseGetEntityListParams<TFilters>) => {
  return useQuery<IPaginatedResponse<TItem>, AxiosError<IAxioDataError>>({
    queryKey: [url, filters],
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IPaginatedResponse<TItem>>(url, {
        params: filters,
      });
      return data;
    },
    enabled,
    placeholderData: (previousData) => previousData,
  });
};
