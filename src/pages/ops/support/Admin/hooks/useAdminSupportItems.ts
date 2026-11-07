import { useQuery } from '@tanstack/react-query';
import { listSupportItems } from '@/services/support';
import { supportItemKeys } from '@/services/support/queryKeys';
import type { SupportItemFilters } from '@/services/support/types';

export function useAdminSupportItemList(filters: SupportItemFilters) {
  return useQuery({
    queryKey: supportItemKeys.list(filters),
    queryFn: () => listSupportItems(filters),
  });
}
