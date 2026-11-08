import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { archiveQuestion, createQuestion, listQuestions } from '@/services/question-bank';
import { questionKeys } from '@/services/question-bank/queryKeys';
import type { CreateQuestionInput, QuestionFilters } from '@/services/question-bank/types';
import { listConcepts } from '@/services/knowledge';
import { conceptKeys } from '@/services/knowledge/queryKeys';

export function useAdminQuestionList(filters: QuestionFilters) {
  return useQuery({
    queryKey: questionKeys.list(filters),
    queryFn: () => listQuestions(filters),
  });
}

export function useConceptOptions() {
  return useQuery({
    queryKey: conceptKeys.list({ limit: 100 }),
    queryFn: () => listConcepts({ limit: 100 }),
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestionInput) => createQuestion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionKeys.all }),
  });
}

export function useArchiveQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveQuestion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionKeys.all }),
  });
}
