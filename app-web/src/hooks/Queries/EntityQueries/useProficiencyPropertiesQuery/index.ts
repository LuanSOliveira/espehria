'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IProficiencyProperty } from '@/shared/interfaces';

const PROFICIENCY_PROPERTIES_QUERY_KEY = ['/proficiency-properties'];

export const useProficiencyPropertiesQuery = () => {
  return useQuery<IProficiencyProperty[], AxiosError<IAxioDataError>>({
    queryKey: PROFICIENCY_PROPERTIES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IProficiencyProperty[]>(
        '/proficiency-properties',
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
