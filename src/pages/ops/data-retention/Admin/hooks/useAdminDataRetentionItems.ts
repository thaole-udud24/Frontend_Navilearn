import { useQuery } from '@tanstack/react-query';
import { listDataRetentionItems } from '@/services/data-retention';
import { dataRetentionItemKeys } from '@/services/data-retention/queryKeys';
import type { DataRetentionItemFilters } from '@/services/data-retention/types';

export function useAdminDataRetentionItemList(filters: DataRetentionItemFilters) {
  return useQuery({
    queryKey: dataRetentionItemKeys.list(filters),
    queryFn: () => listDataRetentionItems(filters),
  });
}
