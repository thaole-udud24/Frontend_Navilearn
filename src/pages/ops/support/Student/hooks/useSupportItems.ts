import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSupportItem, listSupportItems } from '@/services/support';
import { supportItemKeys } from '@/services/support/queryKeys';
import type { CreateSupportItemInput, SupportItemFilters } from '@/services/support/types';

export function useSupportItemList(filters: SupportItemFilters) {
  return useQuery({
    queryKey: supportItemKeys.list(filters),
    queryFn: () => listSupportItems(filters),
  });
}

export function useCreateSupportItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupportItemInput) => createSupportItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportItemKeys.all }),
  });
}
