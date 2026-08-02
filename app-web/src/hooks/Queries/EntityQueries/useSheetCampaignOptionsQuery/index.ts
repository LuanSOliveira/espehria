'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ISheetCampaignOption } from '@/shared/interfaces';

const SHEET_CAMPAIGN_OPTIONS_QUERY_KEY = ['/sheets/campaign-options'];

export const useSheetCampaignOptionsQuery = () => {
  return useQuery<ISheetCampaignOption[], AxiosError<IAxioDataError>>({
    queryKey: SHEET_CAMPAIGN_OPTIONS_QUERY_KEY,
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<ISheetCampaignOption[]>(
        '/sheets/campaign-options',
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
