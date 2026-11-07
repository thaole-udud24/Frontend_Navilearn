import { useQuery } from '@tanstack/react-query';
import { listBusinessRuleItems } from '@/services/business-rule';
import { businessRuleItemKeys } from '@/services/business-rule/queryKeys';
import type { BusinessRuleItemFilters } from '@/services/business-rule/types';

export function useAdminBusinessRuleItemList(filters: BusinessRuleItemFilters) {
  return useQuery({
    queryKey: businessRuleItemKeys.list(filters),
    queryFn: () => listBusinessRuleItems(filters),
  });
}
