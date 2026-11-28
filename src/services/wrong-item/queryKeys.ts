import type { WrongItemFilters } from './types';

export const wrongItemKeys = {
  all: ['wrongItems'] as const,
  list: (filters: WrongItemFilters) => [...wrongItemKeys.all, 'list', filters] as const,
};
