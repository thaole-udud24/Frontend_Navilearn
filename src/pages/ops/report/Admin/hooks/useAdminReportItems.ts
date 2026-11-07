import { useQuery } from '@tanstack/react-query';
import { listReportItems } from '@/services/report';
import { reportItemKeys } from '@/services/report/queryKeys';
import type { ReportItemFilters } from '@/services/report/types';

export function useAdminReportItemList(filters: ReportItemFilters) {
  return useQuery({
    queryKey: reportItemKeys.list(filters),
    queryFn: () => listReportItems(filters),
  });
}
