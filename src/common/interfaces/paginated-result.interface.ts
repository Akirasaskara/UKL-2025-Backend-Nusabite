export interface PaginationMeta {
  readonly totalItems: number;
  readonly itemCount: number;
  readonly itemsPerPage: number;
  readonly totalPages: number;
  readonly currentPage: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface PaginationResult<T> {
  readonly data: T[];
  readonly meta: PaginationMeta;
}
