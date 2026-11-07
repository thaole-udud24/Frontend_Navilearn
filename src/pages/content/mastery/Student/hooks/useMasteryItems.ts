import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMasteryItem, listMasteryItems } from '@/services/mastery';
import { masteryItemKeys } from '@/services/mastery/queryKeys';
import type { CreateMasteryItemInput, MasteryItemFilters } from '@/services/mastery/types';

export function useMasteryItemList(filters: MasteryItemFilters) {
  return useQuery({
    queryKey: masteryItemKeys.list(filters),
    queryFn: () => listMasteryItems(filters),
  });
}

export function useCreateMasteryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMasteryItemInput) => createMasteryItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masteryItemKeys.all }),
  });
}
