'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { ICurrency, IAxioDataError } from '@/shared/interfaces';

const CURRENCIES_QUERY_KEY = ['/currencies'];

export const useCurrenciesQuery = () => {
  return useQuery<ICurrency[], AxiosError<IAxioDataError>>({
    queryKey: CURRENCIES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<ICurrency[]>('/currencies');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
