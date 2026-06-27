import { useState, useMemo } from 'react';

interface UsePaginationParams {
  totalItems?: number;
  defaultPage?: number;
  defaultPageSize?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export function usePagination({
  totalItems = 0,
  defaultPage = 1,
  defaultPageSize = 20,
}: UsePaginationParams = {}): UsePaginationReturn {
  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const offset = (page - 1) * pageSize;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const nextPage = (): void => setPage((p) => Math.min(p + 1, totalPages));
  const prevPage = (): void => setPage((p) => Math.max(p - 1, 1));
  const goToPage = (p: number): void => setPage(Math.max(1, Math.min(p, totalPages)));

  const setPageSize = (size: number): void => {
    setPageSizeState(size);
    setPage(1);
  };

  const reset = (): void => {
    setPage(defaultPage);
    setPageSizeState(defaultPageSize);
  };

  return { page, pageSize, totalPages, offset, hasNext, hasPrev, nextPage, prevPage, goToPage, setPageSize, reset };
}
