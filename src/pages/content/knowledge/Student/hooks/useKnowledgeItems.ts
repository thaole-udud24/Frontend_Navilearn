import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createKnowledgeItem, listKnowledgeItems } from '@/services/knowledge';
import { knowledgeItemKeys } from '@/services/knowledge/queryKeys';
import type { CreateKnowledgeItemInput, KnowledgeItemFilters } from '@/services/knowledge/types';

export function useKnowledgeItemList(filters: KnowledgeItemFilters) {
  return useQuery({
    queryKey: knowledgeItemKeys.list(filters),
    queryFn: () => listKnowledgeItems(filters),
  });
}

export function useCreateKnowledgeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKnowledgeItemInput) => createKnowledgeItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: knowledgeItemKeys.all }),
  });
}
