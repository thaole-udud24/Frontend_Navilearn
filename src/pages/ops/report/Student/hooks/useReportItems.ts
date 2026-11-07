import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createReportItem, listReportItems } from '@/services/report';
import { reportItemKeys } from '@/services/report/queryKeys';
import type { CreateReportItemInput, ReportItemFilters } from '@/services/report/types';

export function useReportItemList(filters: ReportItemFilters) {
  return useQuery({
    queryKey: reportItemKeys.list(filters),
    queryFn: () => listReportItems(filters),
  });
}

export function useCreateReportItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportItemInput) => createReportItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportItemKeys.all }),
  });
}
