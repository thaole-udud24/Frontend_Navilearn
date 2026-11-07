import { useQuery } from '@tanstack/react-query';
import { listAdaptiveItems } from '@/services/adaptive';
import { adaptiveItemKeys } from '@/services/adaptive/queryKeys';
import type { AdaptiveItemFilters } from '@/services/adaptive/types';

export function useAdminAdaptiveItemList(filters: AdaptiveItemFilters) {
  return useQuery({
    queryKey: adaptiveItemKeys.list(filters),
    queryFn: () => listAdaptiveItems(filters),
  });
}
