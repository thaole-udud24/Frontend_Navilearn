import type { PlanningItemFilters } from '@/services/planning/types';

export const planningItemKeys = {
  all: ['planningItems'] as const,
  list: (filters: PlanningItemFilters) => [...planningItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...planningItemKeys.all, 'detail', id] as const,
};
