import type { PlanTemplateFilters } from './types';

export const planTemplateKeys = {
  all: ['planTemplateItems'] as const,
  list: (filters: PlanTemplateFilters) => [...planTemplateKeys.all, 'list', filters] as const,
  detail: (id: string) => [...planTemplateKeys.all, 'detail', id] as const,
};
