import type { SubjectItemFilters } from '@/services/subject/types';

export const subjectItemKeys = {
  all: ['subjectItems'] as const,
  list: (filters: SubjectItemFilters) => [...subjectItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...subjectItemKeys.all, 'detail', id] as const,
};
