'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ICreatureCategory } from '@/shared/interfaces';

const CREATURE_CATEGORIES_QUERY_KEY = ['/creatures/categories'];

export const useCreatureCategoriesQuery = () => {
  return useQuery<ICreatureCategory[], AxiosError<IAxioDataError>>({
    queryKey: CREATURE_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<ICreatureCategory[]>(
        '/creatures/categories',
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
