import { useState } from 'react';

export interface PagedListState {
  page: number;
  limit: number;
}

/** Shared paging state for list pages; combine with React Query in services/<domain>. */
export function usePagedList(initial: PagedListState = { page: 1, limit: 20 }) {
  const [paging, setPaging] = useState<PagedListState>(initial);

  const setPage = (page: number) => setPaging((p) => ({ ...p, page }));
  const setLimit = (limit: number) => setPaging({ page: 1, limit });

  return { paging, setPage, setLimit };
}
