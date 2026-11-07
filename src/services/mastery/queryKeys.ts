import type { MasteryItemFilters } from '@/services/mastery/types';

export const masteryItemKeys = {
  all: ['masteryItems'] as const,
  list: (filters: MasteryItemFilters) => [...masteryItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...masteryItemKeys.all, 'detail', id] as const,
};
