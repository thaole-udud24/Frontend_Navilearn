import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAdaptiveItem, listAdaptiveItems } from '@/services/adaptive';
import { adaptiveItemKeys } from '@/services/adaptive/queryKeys';
import type { CreateAdaptiveItemInput, AdaptiveItemFilters } from '@/services/adaptive/types';

export function useAdaptiveItemList(filters: AdaptiveItemFilters) {
  return useQuery({
    queryKey: adaptiveItemKeys.list(filters),
    queryFn: () => listAdaptiveItems(filters),
  });
}

export function useCreateAdaptiveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdaptiveItemInput) => createAdaptiveItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adaptiveItemKeys.all }),
  });
}
