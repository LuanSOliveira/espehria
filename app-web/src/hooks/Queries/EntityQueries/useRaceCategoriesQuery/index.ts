'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IRaceCategory } from '@/shared/interfaces';

const RACE_CATEGORIES_QUERY_KEY = ['/races/categories'];

export const useRaceCategoriesQuery = () => {
  return useQuery<IRaceCategory[], AxiosError<IAxioDataError>>({
    queryKey: RACE_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IRaceCategory[]>('/races/categories');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
