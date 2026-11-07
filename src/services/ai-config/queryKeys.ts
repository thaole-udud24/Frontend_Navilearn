import type { AiConfigItemFilters } from '@/services/ai-config/types';

export const aiConfigItemKeys = {
  all: ['aiConfigItems'] as const,
  list: (filters: AiConfigItemFilters) => [...aiConfigItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...aiConfigItemKeys.all, 'detail', id] as const,
};
