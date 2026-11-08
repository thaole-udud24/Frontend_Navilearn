import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { DraftQuestion, GenerateQuestionInput } from './types';

export async function generateQuestionDraft(input: GenerateQuestionInput): Promise<DraftQuestion> {
  const { data } = await request.post<ApiSuccess<DraftQuestion>>(ENDPOINTS.aiAssistItems.generateQuestion, input);
  return data.data;
}
