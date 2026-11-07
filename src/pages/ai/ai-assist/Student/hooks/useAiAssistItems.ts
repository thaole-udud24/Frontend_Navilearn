import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAiAssistItem, listAiAssistItems } from '@/services/ai-assist';
import { aiAssistItemKeys } from '@/services/ai-assist/queryKeys';
import type { CreateAiAssistItemInput, AiAssistItemFilters } from '@/services/ai-assist/types';

export function useAiAssistItemList(filters: AiAssistItemFilters) {
  return useQuery({
    queryKey: aiAssistItemKeys.list(filters),
    queryFn: () => listAiAssistItems(filters),
  });
}

export function useCreateAiAssistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAiAssistItemInput) => createAiAssistItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiAssistItemKeys.all }),
  });
}
