import type { AiAssistItemFilters } from '@/services/ai-assist/types';

export const aiAssistItemKeys = {
  all: ['aiAssistItems'] as const,
  list: (filters: AiAssistItemFilters) => [...aiAssistItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...aiAssistItemKeys.all, 'detail', id] as const,
};
