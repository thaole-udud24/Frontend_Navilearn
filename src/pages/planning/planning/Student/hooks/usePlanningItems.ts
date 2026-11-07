import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPlanningItem, listPlanningItems } from '@/services/planning';
import { planningItemKeys } from '@/services/planning/queryKeys';
import type { CreatePlanningItemInput, PlanningItemFilters } from '@/services/planning/types';

export function usePlanningItemList(filters: PlanningItemFilters) {
  return useQuery({
    queryKey: planningItemKeys.list(filters),
    queryFn: () => listPlanningItems(filters),
  });
}

export function useCreatePlanningItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanningItemInput) => createPlanningItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planningItemKeys.all }),
  });
}
