'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IEraOption } from '@/shared/interfaces';

const ERAS_ALL_QUERY_KEY = ['/eras/all'];

export const useErasAllQuery = () => {
  return useQuery<IEraOption[], AxiosError<IAxioDataError>>({
    queryKey: ERAS_ALL_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IEraOption[]>('/eras/all');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
