import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAiConfigItem, listAiConfigItems } from '@/services/ai-config';
import { aiConfigItemKeys } from '@/services/ai-config/queryKeys';
import type { CreateAiConfigItemInput, AiConfigItemFilters } from '@/services/ai-config/types';

export function useAiConfigItemList(filters: AiConfigItemFilters) {
  return useQuery({
    queryKey: aiConfigItemKeys.list(filters),
    queryFn: () => listAiConfigItems(filters),
  });
}

export function useCreateAiConfigItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAiConfigItemInput) => createAiConfigItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiConfigItemKeys.all }),
  });
}
