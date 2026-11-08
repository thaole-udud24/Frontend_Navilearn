import type { ConceptFilters } from './types';

export const conceptKeys = {
  all: ['concepts'] as const,
  list: (filters: ConceptFilters) => [...conceptKeys.all, 'list', filters] as const,
  detail: (id: string) => [...conceptKeys.all, 'detail', id] as const,
};
