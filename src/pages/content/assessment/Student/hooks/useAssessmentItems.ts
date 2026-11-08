import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAssessments, submitAssessment } from '@/services/assessment';
import { assessmentKeys } from '@/services/assessment/queryKeys';
import type { AssessmentFilters, SubmitAssessmentInput } from '@/services/assessment/types';
import { getAssessmentConfig } from '@/services/assessment-config';
import { getQuestion } from '@/services/question-bank';

export function useAssessmentList(filters: AssessmentFilters) {
  return useQuery({
    queryKey: assessmentKeys.list(filters),
    queryFn: () => listAssessments(filters),
  });
}

// Loads the quiz definition and every question it references, for the attempt-taking form.
export function useAssessmentQuestions(assessmentConfigId: string | undefined) {
  return useQuery({
    queryKey: ['assessmentQuestions', assessmentConfigId],
    queryFn: async () => {
      const config = await getAssessmentConfig(assessmentConfigId as string);
      const questions = await Promise.all(config.questions.map((id) => getQuestion(id)));
      return { config, questions };
    },
    enabled: Boolean(assessmentConfigId),
  });
}

export function useSubmitAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubmitAssessmentInput }) => submitAssessment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentKeys.all }),
  });
}
