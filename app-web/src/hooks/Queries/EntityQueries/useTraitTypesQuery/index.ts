'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ITraitType } from '@/shared/interfaces';

const TRAIT_TYPES_QUERY_KEY = ['/trait-types'];

export const useTraitTypesQuery = () => {
  return useQuery<ITraitType[], AxiosError<IAxioDataError>>({
    queryKey: TRAIT_TYPES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<ITraitType[]>('/trait-types');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
