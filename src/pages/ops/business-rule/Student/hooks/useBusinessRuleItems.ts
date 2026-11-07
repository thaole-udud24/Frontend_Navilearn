import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBusinessRuleItem, listBusinessRuleItems } from '@/services/business-rule';
import { businessRuleItemKeys } from '@/services/business-rule/queryKeys';
import type { CreateBusinessRuleItemInput, BusinessRuleItemFilters } from '@/services/business-rule/types';

export function useBusinessRuleItemList(filters: BusinessRuleItemFilters) {
  return useQuery({
    queryKey: businessRuleItemKeys.list(filters),
    queryFn: () => listBusinessRuleItems(filters),
  });
}

export function useCreateBusinessRuleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBusinessRuleItemInput) => createBusinessRuleItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: businessRuleItemKeys.all }),
  });
}
