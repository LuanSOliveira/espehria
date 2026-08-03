'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IImprovementDefectType } from '@/shared/interfaces';

const IMPROVEMENT_DEFECT_TYPES_QUERY_KEY = ['/improvement-flaw-types'];

export const useImprovementDefectTypesQuery = () => {
  return useQuery<IImprovementDefectType[], AxiosError<IAxioDataError>>({
    queryKey: IMPROVEMENT_DEFECT_TYPES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IImprovementDefectType[]>(
        '/improvement-flaw-types',
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
