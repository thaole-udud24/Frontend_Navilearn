import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAssessmentConfigs } from '@/services/assessment-config';
import { assessmentConfigKeys } from '@/services/assessment-config/queryKeys';
import type { AssessmentConfigFilters } from '@/services/assessment-config/types';
import { startAssessment } from '@/services/assessment';
import { assessmentKeys } from '@/services/assessment/queryKeys';

export function useAssessmentConfigList(filters: AssessmentConfigFilters) {
  return useQuery({
    queryKey: assessmentConfigKeys.list(filters),
    queryFn: () => listAssessmentConfigs(filters),
  });
}

export function useStartAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assessmentConfigId: string) => startAssessment(assessmentConfigId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentKeys.all }),
  });
}
