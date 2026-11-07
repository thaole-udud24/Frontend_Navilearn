import type { AccountItemFilters } from '@/services/account/types';

export const accountItemKeys = {
  all: ['accountItems'] as const,
  list: (filters: AccountItemFilters) => [...accountItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...accountItemKeys.all, 'detail', id] as const,
};
