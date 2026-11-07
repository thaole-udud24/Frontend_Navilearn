import { useQuery } from '@tanstack/react-query';
import { listAssessmentConfigItems } from '@/services/assessment-config';
import { assessmentConfigItemKeys } from '@/services/assessment-config/queryKeys';
import type { AssessmentConfigItemFilters } from '@/services/assessment-config/types';

export function useAdminAssessmentConfigItemList(filters: AssessmentConfigItemFilters) {
  return useQuery({
    queryKey: assessmentConfigItemKeys.list(filters),
    queryFn: () => listAssessmentConfigItems(filters),
  });
}
