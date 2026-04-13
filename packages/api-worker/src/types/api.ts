export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}
