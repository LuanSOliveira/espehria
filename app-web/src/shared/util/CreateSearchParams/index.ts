import { SearchQueryParams } from '@/shared/types';

export const creteSearchParams = (
  queryParamsInput: SearchQueryParams,
): string => {
  let queryParams: string = '';

  for (const key in queryParamsInput) {
    if (
      queryParamsInput[key as keyof SearchQueryParams] === 0 ||
      queryParamsInput[key as keyof SearchQueryParams]
    ) {
      if (!queryParams) {
        queryParams += `?${key}=${
          queryParamsInput[key as keyof SearchQueryParams]
        }`;
      } else {
        queryParams += `&${key}=${
          queryParamsInput[key as keyof SearchQueryParams]
        }`;
      }
    }
  }

  return queryParams;
};
