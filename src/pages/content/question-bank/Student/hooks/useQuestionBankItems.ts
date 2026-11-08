import { useQuery } from '@tanstack/react-query';
import { listQuestions } from '@/services/question-bank';
import { questionKeys } from '@/services/question-bank/queryKeys';
import type { QuestionFilters } from '@/services/question-bank/types';

export function useQuestionList(filters: QuestionFilters) {
  return useQuery({
    queryKey: questionKeys.list(filters),
    queryFn: () => listQuestions(filters),
  });
}
