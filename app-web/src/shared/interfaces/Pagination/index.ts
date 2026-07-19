export interface IPaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface IPaginationParams {
  page?: number;
  perPage?: number;
}
