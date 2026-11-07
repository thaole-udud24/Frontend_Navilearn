import type { MonitoringItemFilters } from '@/services/monitoring/types';

export const monitoringItemKeys = {
  all: ['monitoringItems'] as const,
  list: (filters: MonitoringItemFilters) => [...monitoringItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...monitoringItemKeys.all, 'detail', id] as const,
};
