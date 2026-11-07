import type { QuestionBankItemFilters } from '@/services/question-bank/types';

export const questionBankItemKeys = {
  all: ['questionBankItems'] as const,
  list: (filters: QuestionBankItemFilters) => [...questionBankItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...questionBankItemKeys.all, 'detail', id] as const,
};
