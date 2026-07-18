export type SortDirection = 'ASC' | 'DESC';

export interface SearchQueryParams {
  page?: number;
  perPage?: number;
  sort?: string;
  relations?: string;
  sortDir?: SortDirection;
  filter?: string;
  field?: string;
  size?: number;
}
