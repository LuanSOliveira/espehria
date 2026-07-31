'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAttribute, IAxioDataError } from '@/shared/interfaces';

const ATTRIBUTES_QUERY_KEY = ['/attributes'];

export const useAttributesQuery = () => {
  return useQuery<IAttribute[], AxiosError<IAxioDataError>>({
    queryKey: ATTRIBUTES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IAttribute[]>('/attributes');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
