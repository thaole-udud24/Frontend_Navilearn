import type { AdaptiveItemFilters } from '@/services/adaptive/types';

export const adaptiveItemKeys = {
  all: ['adaptiveItems'] as const,
  list: (filters: AdaptiveItemFilters) => [...adaptiveItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...adaptiveItemKeys.all, 'detail', id] as const,
};
