import type { RiskItemFilters } from '@/services/risk/types';

export const riskItemKeys = {
  all: ['riskItems'] as const,
  list: (filters: RiskItemFilters) => [...riskItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...riskItemKeys.all, 'detail', id] as const,
};
