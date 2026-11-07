import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDataRetentionItem, listDataRetentionItems } from '@/services/data-retention';
import { dataRetentionItemKeys } from '@/services/data-retention/queryKeys';
import type { CreateDataRetentionItemInput, DataRetentionItemFilters } from '@/services/data-retention/types';

export function useDataRetentionItemList(filters: DataRetentionItemFilters) {
  return useQuery({
    queryKey: dataRetentionItemKeys.list(filters),
    queryFn: () => listDataRetentionItems(filters),
  });
}

export function useCreateDataRetentionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDataRetentionItemInput) => createDataRetentionItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dataRetentionItemKeys.all }),
  });
}
