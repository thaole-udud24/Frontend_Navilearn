import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import { generateQuestionDraft } from '@/services/ai-assist';
import type { DraftQuestion, GenerateQuestionInput } from '@/services/ai-assist/types';
import { listConcepts } from '@/services/knowledge';
import { conceptKeys } from '@/services/knowledge/queryKeys';

interface AiAssistLog {
  _id: string;
  kind: 'generate_question' | 'grade_essay';
  prompt: string;
  response: string;
  createdAt: string;
}

export function useAdminAiAssistLogList(filters: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['aiAssistLogs', filters],
    queryFn: async () => {
      const { data } = await request.get<ApiSuccess<AiAssistLog[]>>(ENDPOINTS.aiAssistItems.list, { params: filters });
      return data;
    },
  });
}

export function useConceptOptions() {
  return useQuery({
    queryKey: conceptKeys.list({ limit: 100 }),
    queryFn: () => listConcepts({ limit: 100 }),
  });
}

export function useGenerateQuestionDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateQuestionInput): Promise<DraftQuestion> => generateQuestionDraft(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aiAssistLogs'] }),
  });
}
