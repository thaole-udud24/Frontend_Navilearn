import type { QuestionFilters } from './types';

export const questionKeys = {
  all: ['questions'] as const,
  list: (filters: QuestionFilters) => [...questionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...questionKeys.all, 'detail', id] as const,
};
