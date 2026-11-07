import type { AdminReportItemFilters } from '@/services/admin-report/types';

export const adminReportItemKeys = {
  all: ['adminReportItems'] as const,
  list: (filters: AdminReportItemFilters) => [...adminReportItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...adminReportItemKeys.all, 'detail', id] as const,
};
