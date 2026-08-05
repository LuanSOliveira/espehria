'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, IProficiencyGradation } from '@/shared/interfaces';

const PROFICIENCY_GRADATIONS_QUERY_KEY = ['/proficiency-gradations'];

export const useProficiencyGradationsQuery = () => {
  return useQuery<IProficiencyGradation[], AxiosError<IAxioDataError>>({
    queryKey: PROFICIENCY_GRADATIONS_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<IProficiencyGradation[]>(
        '/proficiency-gradations',
      );
      // A API não garante a ordem; ordenar por level crescente garante a
      // sequência Destreinado < Básico < Avançado < Especialista < Lendário
      // em qualquer autocomplete que consuma este hook.
      return [...data].sort((a, b) => a.level - b.level);
    },
    staleTime: 5 * 60 * 1000,
  });
};
