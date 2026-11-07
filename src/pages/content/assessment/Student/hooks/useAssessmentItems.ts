import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAssessmentItem, listAssessmentItems } from '@/services/assessment';
import { assessmentItemKeys } from '@/services/assessment/queryKeys';
import type { CreateAssessmentItemInput, AssessmentItemFilters } from '@/services/assessment/types';

export function useAssessmentItemList(filters: AssessmentItemFilters) {
  return useQuery({
    queryKey: assessmentItemKeys.list(filters),
    queryFn: () => listAssessmentItems(filters),
  });
}

export function useCreateAssessmentItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssessmentItemInput) => createAssessmentItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentItemKeys.all }),
  });
}
