import type { AssessmentItemFilters } from '@/services/assessment/types';

export const assessmentItemKeys = {
  all: ['assessmentItems'] as const,
  list: (filters: AssessmentItemFilters) => [...assessmentItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...assessmentItemKeys.all, 'detail', id] as const,
};
