import type { BusinessRuleFilters } from '@/services/business-rule/types';

export const businessRuleItemKeys = {
  all: ['businessRuleItems'] as const,
  list: (filters: BusinessRuleFilters) => [...businessRuleItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...businessRuleItemKeys.all, 'detail', id] as const,
};
