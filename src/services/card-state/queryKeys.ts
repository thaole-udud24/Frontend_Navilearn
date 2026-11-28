import type { DueCardsFilters } from './types';

export const cardStateKeys = {
  all: ['cardStates'] as const,
  due: (filters: DueCardsFilters) => [...cardStateKeys.all, 'due', filters] as const,
  stats: (deck?: string) => [...cardStateKeys.all, 'stats', deck] as const,
};
