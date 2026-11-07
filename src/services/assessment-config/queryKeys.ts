import type { AssessmentConfigItemFilters } from '@/services/assessment-config/types';

export const assessmentConfigItemKeys = {
  all: ['assessmentConfigItems'] as const,
  list: (filters: AssessmentConfigItemFilters) => [...assessmentConfigItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...assessmentConfigItemKeys.all, 'detail', id] as const,
};
