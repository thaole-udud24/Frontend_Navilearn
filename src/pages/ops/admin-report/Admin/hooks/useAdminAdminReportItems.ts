import { useQuery } from '@tanstack/react-query';
import { listAdminReportItems } from '@/services/admin-report';
import { adminReportItemKeys } from '@/services/admin-report/queryKeys';
import type { AdminReportItemFilters } from '@/services/admin-report/types';

export function useAdminAdminReportItemList(filters: AdminReportItemFilters) {
  return useQuery({
    queryKey: adminReportItemKeys.list(filters),
    queryFn: () => listAdminReportItems(filters),
  });
}
