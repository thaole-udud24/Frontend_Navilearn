import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  AiAssistFilters,
  AiAssistItem,
  AiAssistItemFilters,
  AiAssistLog,
  AskInput,
  CreateAiAssistItemInput,
  DraftQuestion,
  EssayFeedbackInput,
  ExplainWrongInput,
  GenerateQuestionInput,
} from './types';

export async function listAiAssistItems(filters: AiAssistItemFilters): Promise<ApiSuccess<AiAssistItem[]>> {
  const { data } = await request.get<ApiSuccess<AiAssistItem[]>>(ENDPOINTS.aiAssistItems.list, { params: filters });
  return data;
}

export async function createAiAssistItem(input: CreateAiAssistItemInput): Promise<AiAssistItem> {
  const { data } = await request.post<ApiSuccess<AiAssistItem>>(ENDPOINTS.aiAssistItems.create, input);
  return data.data;
}

export async function practiceQuestion(input: GenerateQuestionInput): Promise<DraftQuestion> {
  const { data } = await request.post<ApiSuccess<DraftQuestion>>('/ai-assist-items/practice-question', input);
  return data.data;
}

export async function askAi(input: AskInput): Promise<{ answer: string; sources: { concept: string; label: string }[] }> {
  const { data } = await request.post<ApiSuccess<{ answer: string; sources: { concept: string; label: string }[] }>>(
    '/ai-assist-items/ask',
    input,
  );
  return data.data;
}

export async function explainWrong(input: ExplainWrongInput): Promise<{ explanation: string }> {
  const { data } = await request.post<ApiSuccess<{ explanation: string }>>('/ai-assist-items/explain-wrong', input);
  return data.data;
}

export async function essayFeedback(input: EssayFeedbackInput): Promise<{ feedback: string }> {
  const { data } = await request.post<ApiSuccess<{ feedback: string }>>('/ai-assist-items/essay-feedback', input);
  return data.data;
}

export async function listAiAssistLogs(filters: AiAssistFilters): Promise<ApiSuccess<AiAssistLog[]>> {
  const { data } = await request.get<ApiSuccess<AiAssistLog[]>>(ENDPOINTS.aiAssistItems.list, { params: filters });
  return data;
}

export async function removeAiAssistLog(id: string): Promise<void> {
  await request.delete(ENDPOINTS.aiAssistItems.detail(id));
}

export async function rateAiAssistLog(id: string, rating: number, comment?: string): Promise<AiAssistLog> {
  const { data } = await request.post<ApiSuccess<AiAssistLog>>(`/ai-assist-items/${id}/rate`, { rating, comment });
  return data.data;
}

export async function reportAiAssistLog(id: string, reason: string): Promise<AiAssistLog> {
  const { data } = await request.post<ApiSuccess<AiAssistLog>>(`/ai-assist-items/${id}/report`, { reason });
  return data.data;
}
