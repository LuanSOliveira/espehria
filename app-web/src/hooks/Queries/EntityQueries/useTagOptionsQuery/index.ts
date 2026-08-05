'use client';

import { useGetEntityList } from '../../DefaultQueries';
import { TAG_OPTIONS_PER_PAGE } from '@/shared/constants';
import { ITag, ITagListFilters } from '@/shared/interfaces';

export const useTagOptionsQuery = () => {
  const query = useGetEntityList<ITag, ITagListFilters>({
    url: '/tags',
    filters: { perPage: TAG_OPTIONS_PER_PAGE },
  });

  return { ...query, tagOptions: query.data?.data ?? [] };
};
