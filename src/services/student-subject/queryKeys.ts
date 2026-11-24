import type { StudentSubjectFilters } from './types';

export const studentSubjectKeys = {
  all: ['student-subject'] as const,
  list: (filters: StudentSubjectFilters = {}) => [...studentSubjectKeys.all, 'list', filters] as const,
};
