import { useQuery } from '@tanstack/react-query';
import { listAssessmentItems } from '@/services/assessment';
import { assessmentItemKeys } from '@/services/assessment/queryKeys';
import type { AssessmentItemFilters } from '@/services/assessment/types';

export function useAdminAssessmentItemList(filters: AssessmentItemFilters) {
  return useQuery({
    queryKey: assessmentItemKeys.list(filters),
    queryFn: () => listAssessmentItems(filters),
  });
}
