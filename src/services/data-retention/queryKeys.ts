import type { DataRetentionItemFilters } from '@/services/data-retention/types';

export const dataRetentionItemKeys = {
  all: ['dataRetentionItems'] as const,
  list: (filters: DataRetentionItemFilters) => [...dataRetentionItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...dataRetentionItemKeys.all, 'detail', id] as const,
};
