import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTemplateItem, listTemplateItems } from '@/services/_template';
import { templateItemKeys } from '@/services/_template/queryKeys';
import type { CreateTemplateItemInput, TemplateItemFilters } from '@/services/_template/types';

export function useTemplateItemList(filters: TemplateItemFilters) {
  return useQuery({
    queryKey: templateItemKeys.list(filters),
    queryFn: () => listTemplateItems(filters),
  });
}

export function useCreateTemplateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTemplateItemInput) => createTemplateItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: templateItemKeys.all }),
  });
}
