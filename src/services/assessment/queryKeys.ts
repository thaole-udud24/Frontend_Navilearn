import type { AssessmentFilters } from './types';

export const assessmentKeys = {
  all: ['assessments'] as const,
  list: (filters: AssessmentFilters) => [...assessmentKeys.all, 'list', filters] as const,
  detail: (id: string) => [...assessmentKeys.all, 'detail', id] as const,
};
