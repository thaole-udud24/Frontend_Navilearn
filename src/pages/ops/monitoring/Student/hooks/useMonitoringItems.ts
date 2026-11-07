import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMonitoringItem, listMonitoringItems } from '@/services/monitoring';
import { monitoringItemKeys } from '@/services/monitoring/queryKeys';
import type { CreateMonitoringItemInput, MonitoringItemFilters } from '@/services/monitoring/types';

export function useMonitoringItemList(filters: MonitoringItemFilters) {
  return useQuery({
    queryKey: monitoringItemKeys.list(filters),
    queryFn: () => listMonitoringItems(filters),
  });
}

export function useCreateMonitoringItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMonitoringItemInput) => createMonitoringItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: monitoringItemKeys.all }),
  });
}
