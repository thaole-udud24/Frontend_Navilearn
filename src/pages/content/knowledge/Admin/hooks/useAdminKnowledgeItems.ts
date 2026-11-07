import { useQuery } from '@tanstack/react-query';
import { listKnowledgeItems } from '@/services/knowledge';
import { knowledgeItemKeys } from '@/services/knowledge/queryKeys';
import type { KnowledgeItemFilters } from '@/services/knowledge/types';

export function useAdminKnowledgeItemList(filters: KnowledgeItemFilters) {
  return useQuery({
    queryKey: knowledgeItemKeys.list(filters),
    queryFn: () => listKnowledgeItems(filters),
  });
}
