'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IImprovementDefectProperty } from '@/shared/interfaces';

const IMPROVEMENT_DEFECT_PROPERTIES_QUERY_KEY = ['/improvement-flaw-properties'];

export const useImprovementDefectPropertiesQuery = () => {
  return useQuery<IImprovementDefectProperty[], AxiosError<IAxioDataError>>({
    queryKey: IMPROVEMENT_DEFECT_PROPERTIES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IImprovementDefectProperty[]>(
        '/improvement-flaw-properties',
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
