import { useQuery } from '@tanstack/react-query';
import { listMonitoringItems } from '@/services/monitoring';
import { monitoringItemKeys } from '@/services/monitoring/queryKeys';
import type { MonitoringItemFilters } from '@/services/monitoring/types';

export function useAdminMonitoringItemList(filters: MonitoringItemFilters) {
  return useQuery({
    queryKey: monitoringItemKeys.list(filters),
    queryFn: () => listMonitoringItems(filters),
  });
}
