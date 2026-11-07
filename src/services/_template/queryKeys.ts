import type { TemplateItemFilters } from '@/services/_template/types';

export const templateItemKeys = {
  all: ['templateItems'] as const,
  list: (filters: TemplateItemFilters) => [...templateItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...templateItemKeys.all, 'detail', id] as const,
};
