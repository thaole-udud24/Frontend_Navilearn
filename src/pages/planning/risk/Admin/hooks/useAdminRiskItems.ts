import { useQuery } from '@tanstack/react-query';
import { listRiskItems } from '@/services/risk';
import { riskItemKeys } from '@/services/risk/queryKeys';
import type { RiskItemFilters } from '@/services/risk/types';

export function useAdminRiskItemList(filters: RiskItemFilters) {
  return useQuery({
    queryKey: riskItemKeys.list(filters),
    queryFn: () => listRiskItems(filters),
  });
}
