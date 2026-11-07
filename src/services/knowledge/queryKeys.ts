import type { KnowledgeItemFilters } from '@/services/knowledge/types';

export const knowledgeItemKeys = {
  all: ['knowledgeItems'] as const,
  list: (filters: KnowledgeItemFilters) => [...knowledgeItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...knowledgeItemKeys.all, 'detail', id] as const,
};
