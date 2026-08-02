'use client';

import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiFactory } from '@/services/api';
import { getAuthToken } from '@/services/jwt';
import { IAxioDataError, ICampaignSheetListItem } from '@/shared/interfaces';

export interface UseCampaignSheetsQueryParams {
  campaignId: string;
  enabled?: boolean;
}

export const useCampaignSheetsQuery = ({
  campaignId,
  enabled = true,
}: UseCampaignSheetsQueryParams) => {
  const url = `/campaigns/${campaignId}/sheets`;

  return useQuery<ICampaignSheetListItem[], AxiosError<IAxioDataError>>({
    queryKey: [url],
    queryFn: async () => {
      const api = ApiFactory(getAuthToken());
      const { data } = await api.get<ICampaignSheetListItem[]>(url);
      return data;
    },
    enabled,
  });
};
