import { useQuery } from '@tanstack/react-query';
import { listPlanningItems } from '@/services/planning';
import { planningItemKeys } from '@/services/planning/queryKeys';
import type { PlanningItemFilters } from '@/services/planning/types';

export function useAdminPlanningItemList(filters: PlanningItemFilters) {
  return useQuery({
    queryKey: planningItemKeys.list(filters),
    queryFn: () => listPlanningItems(filters),
  });
}
