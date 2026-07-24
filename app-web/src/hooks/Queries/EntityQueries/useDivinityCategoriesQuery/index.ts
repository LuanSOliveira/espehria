'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IDivinityCategory } from '@/shared/interfaces';

const DIVINITY_CATEGORIES_QUERY_KEY = ['/divinities/categories'];

export const useDivinityCategoriesQuery = () => {
  return useQuery<IDivinityCategory[], AxiosError<IAxioDataError>>({
    queryKey: DIVINITY_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IDivinityCategory[]>(
        '/divinities/categories',
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
