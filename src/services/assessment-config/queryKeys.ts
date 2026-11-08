import type { AssessmentConfigFilters } from './types';

export const assessmentConfigKeys = {
  all: ['assessmentConfigs'] as const,
  list: (filters: AssessmentConfigFilters) => [...assessmentConfigKeys.all, 'list', filters] as const,
  detail: (id: string) => [...assessmentConfigKeys.all, 'detail', id] as const,
};
