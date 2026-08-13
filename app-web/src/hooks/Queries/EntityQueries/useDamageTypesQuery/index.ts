'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IDamageType } from '@/shared/interfaces';

const DAMAGE_TYPES_QUERY_KEY = ['/damage-types'];

export const useDamageTypesQuery = () => {
  return useQuery<IDamageType[], AxiosError<IAxioDataError>>({
    queryKey: DAMAGE_TYPES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IDamageType[]>('/damage-types');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
