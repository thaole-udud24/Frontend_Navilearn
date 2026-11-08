import { useQuery } from '@tanstack/react-query';
import { listMasteries } from '@/services/mastery';
import { masteryKeys } from '@/services/mastery/queryKeys';
import type { MasteryFilters } from '@/services/mastery/types';

export function useMasteryList(filters: MasteryFilters) {
  return useQuery({
    queryKey: masteryKeys.list(filters),
    queryFn: () => listMasteries(filters),
  });
}
