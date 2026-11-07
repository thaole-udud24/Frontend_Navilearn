import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRiskItem, listRiskItems } from '@/services/risk';
import { riskItemKeys } from '@/services/risk/queryKeys';
import type { CreateRiskItemInput, RiskItemFilters } from '@/services/risk/types';

export function useRiskItemList(filters: RiskItemFilters) {
  return useQuery({
    queryKey: riskItemKeys.list(filters),
    queryFn: () => listRiskItems(filters),
  });
}

export function useCreateRiskItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRiskItemInput) => createRiskItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: riskItemKeys.all }),
  });
}
