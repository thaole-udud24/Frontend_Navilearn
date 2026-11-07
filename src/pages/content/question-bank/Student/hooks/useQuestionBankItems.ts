import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createQuestionBankItem, listQuestionBankItems } from '@/services/question-bank';
import { questionBankItemKeys } from '@/services/question-bank/queryKeys';
import type { CreateQuestionBankItemInput, QuestionBankItemFilters } from '@/services/question-bank/types';

export function useQuestionBankItemList(filters: QuestionBankItemFilters) {
  return useQuery({
    queryKey: questionBankItemKeys.list(filters),
    queryFn: () => listQuestionBankItems(filters),
  });
}

export function useCreateQuestionBankItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestionBankItemInput) => createQuestionBankItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: questionBankItemKeys.all }),
  });
}
