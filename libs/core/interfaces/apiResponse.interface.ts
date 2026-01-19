export interface ApiResponse<T> {
  message?: string;
  data: T | null;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  nextPage?: boolean;
  prevPage?: boolean;
}