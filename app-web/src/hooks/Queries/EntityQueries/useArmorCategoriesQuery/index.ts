'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IArmorCategory, IAxioDataError } from '@/shared/interfaces';

const ARMOR_CATEGORIES_QUERY_KEY = ['/armor-categories'];

export const useArmorCategoriesQuery = () => {
  return useQuery<IArmorCategory[], AxiosError<IAxioDataError>>({
    queryKey: ARMOR_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IArmorCategory[]>('/armor-categories');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
