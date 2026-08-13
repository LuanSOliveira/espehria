'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISizeGrade } from '@/shared/interfaces';

const SIZE_GRADES_QUERY_KEY = ['/size-grades'];

export const useSizeGradesQuery = () => {
  return useQuery<ISizeGrade[], AxiosError<IAxioDataError>>({
    queryKey: SIZE_GRADES_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<ISizeGrade[]>('/size-grades');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
