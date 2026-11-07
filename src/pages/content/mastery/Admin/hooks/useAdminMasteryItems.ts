import { useQuery } from '@tanstack/react-query';
import { listMasteryItems } from '@/services/mastery';
import { masteryItemKeys } from '@/services/mastery/queryKeys';
import type { MasteryItemFilters } from '@/services/mastery/types';

export function useAdminMasteryItemList(filters: MasteryItemFilters) {
  return useQuery({
    queryKey: masteryItemKeys.list(filters),
    queryFn: () => listMasteryItems(filters),
  });
}
