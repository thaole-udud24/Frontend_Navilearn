import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { archiveAssessmentConfig, createAssessmentConfig, listAssessmentConfigs } from '@/services/assessment-config';
import { assessmentConfigKeys } from '@/services/assessment-config/queryKeys';
import type { AssessmentConfigFilters, CreateAssessmentConfigInput } from '@/services/assessment-config/types';
import { listConcepts } from '@/services/knowledge';
import { conceptKeys } from '@/services/knowledge/queryKeys';
import { listQuestions } from '@/services/question-bank';
import { questionKeys } from '@/services/question-bank/queryKeys';

export function useAdminAssessmentConfigList(filters: AssessmentConfigFilters) {
  return useQuery({
    queryKey: assessmentConfigKeys.list(filters),
    queryFn: () => listAssessmentConfigs(filters),
  });
}

export function useConceptOptions() {
  return useQuery({
    queryKey: conceptKeys.list({ limit: 100 }),
    queryFn: () => listConcepts({ limit: 100 }),
  });
}

export function useQuestionsByConcept(conceptId: string | undefined) {
  return useQuery({
    queryKey: questionKeys.list({ concept: conceptId, limit: 100 }),
    queryFn: () => listQuestions({ concept: conceptId, limit: 100 }),
    enabled: Boolean(conceptId),
  });
}

export function useCreateAssessmentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssessmentConfigInput) => createAssessmentConfig(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentConfigKeys.all }),
  });
}

export function useArchiveAssessmentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveAssessmentConfig(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentConfigKeys.all }),
  });
}
