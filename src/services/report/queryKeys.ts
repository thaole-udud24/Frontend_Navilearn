import type { ReportItemFilters } from '@/services/report/types';

export const reportItemKeys = {
  all: ['reportItems'] as const,
  list: (filters: ReportItemFilters) => [...reportItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...reportItemKeys.all, 'detail', id] as const,
};
