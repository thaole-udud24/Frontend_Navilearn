import type { ReviewItemFilters } from '@/services/review/types';

export const reviewItemKeys = {
  all: ['reviewItems'] as const,
  list: (filters: ReviewItemFilters) => [...reviewItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...reviewItemKeys.all, 'detail', id] as const,
};
