import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAdminReportItem, listAdminReportItems } from '@/services/admin-report';
import { adminReportItemKeys } from '@/services/admin-report/queryKeys';
import type { CreateAdminReportItemInput, AdminReportItemFilters } from '@/services/admin-report/types';

export function useAdminReportItemList(filters: AdminReportItemFilters) {
  return useQuery({
    queryKey: adminReportItemKeys.list(filters),
    queryFn: () => listAdminReportItems(filters),
  });
}

export function useCreateAdminReportItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminReportItemInput) => createAdminReportItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminReportItemKeys.all }),
  });
}
