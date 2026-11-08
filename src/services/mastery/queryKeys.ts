import type { MasteryFilters } from './types';

export const masteryKeys = {
  all: ['masteries'] as const,
  list: (filters: MasteryFilters) => [...masteryKeys.all, 'list', filters] as const,
};
