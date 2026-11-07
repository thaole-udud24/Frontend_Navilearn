import { useQuery } from '@tanstack/react-query';
import { listQuestionBankItems } from '@/services/question-bank';
import { questionBankItemKeys } from '@/services/question-bank/queryKeys';
import type { QuestionBankItemFilters } from '@/services/question-bank/types';

export function useAdminQuestionBankItemList(filters: QuestionBankItemFilters) {
  return useQuery({
    queryKey: questionBankItemKeys.list(filters),
    queryFn: () => listQuestionBankItems(filters),
  });
}
