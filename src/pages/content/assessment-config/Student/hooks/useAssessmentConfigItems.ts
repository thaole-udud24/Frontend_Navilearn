import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAssessmentConfigItem, listAssessmentConfigItems } from '@/services/assessment-config';
import { assessmentConfigItemKeys } from '@/services/assessment-config/queryKeys';
import type { CreateAssessmentConfigItemInput, AssessmentConfigItemFilters } from '@/services/assessment-config/types';

export function useAssessmentConfigItemList(filters: AssessmentConfigItemFilters) {
  return useQuery({
    queryKey: assessmentConfigItemKeys.list(filters),
    queryFn: () => listAssessmentConfigItems(filters),
  });
}

export function useCreateAssessmentConfigItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssessmentConfigItemInput) => createAssessmentConfigItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentConfigItemKeys.all }),
  });
}
