import type { SupportItemFilters } from '@/services/support/types';

export const supportItemKeys = {
  all: ['supportItems'] as const,
  list: (filters: SupportItemFilters) => [...supportItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...supportItemKeys.all, 'detail', id] as const,
};
