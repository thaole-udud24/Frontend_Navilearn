import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  AiAssistAdminOverview,
  AiAssistFilters,
  AiAssistItem,
  AiAssistItemFilters,
  AiAssistLog,
  AskInput,
  ConceptDraft,
  CreateAiAssistItemInput,
  DraftQuestion,
  EssayFeedbackInput,
  ExplainWrongInput,
  GeneratedStudyPlan,
  GenerateQuestionInput,
  QuestionDraftReviewItem,
  TemplateDraft,
} from './types';

// B6 "Giám sát" (admin-only): recent ai_request-style logs + DB health + rate-limit policy.
export async function getAiAssistAdminOverview(): Promise<AiAssistAdminOverview> {
  const { data } = await request.get<ApiSuccess<AiAssistAdminOverview>>(
    ENDPOINTS.aiAssistItems.adminOverview,
  );
  return data.data;
}

// A5 "Review Workspace".
export async function listQuestionDrafts(limit = 50): Promise<QuestionDraftReviewItem[]> {
  const { data } = await request.get<ApiSuccess<QuestionDraftReviewItem[]>>(
    ENDPOINTS.aiAssistItems.questionDrafts,
    { params: { limit } },
  );
  return data.data;
}

export async function rejectQuestionDraft(aiAssistLogId: string): Promise<void> {
  await request.post(ENDPOINTS.aiAssistItems.rejectQuestionDraft(aiAssistLogId));
}

export async function listAiAssistItems(filters: AiAssistItemFilters): Promise<ApiSuccess<AiAssistItem[]>> {
  const { data } = await request.get<ApiSuccess<AiAssistItem[]>>(ENDPOINTS.aiAssistItems.list, {
    params: filters,
  });
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

// UC-QBK-09 source: admin-only draft generation for the shared question bank.
export async function generateQuestionDraft(input: GenerateQuestionInput): Promise<DraftQuestion> {
  const { data } = await request.post<ApiSuccess<DraftQuestion>>(
    ENDPOINTS.aiAssistItems.generateQuestion,
    input,
  );
  return data.data;
}

// UC-KNW-AI-01: admin-only draft generation for the knowledge map.
export async function generateConceptDraft(topic: string): Promise<ConceptDraft> {
  const { data } = await request.post<ApiSuccess<ConceptDraft>>(ENDPOINTS.aiAssistItems.generateConcept, {
    topic,
  });
  return data.data;
}

// UC-PLN-TPL-04: admin-only draft generation for a whole plan template.
export async function generateTemplateDraft(input: {
  topic?: string;
  conceptId?: string;
  sessionCount?: number;
}): Promise<TemplateDraft> {
  const { data } = await request.post<ApiSuccess<TemplateDraft>>(
    ENDPOINTS.aiAssistItems.generateTemplate,
    input,
  );
  return data.data;
}

export async function askAi(
  input: AskInput,
): Promise<{ answer: string; sources: { concept: string; label: string }[] }> {
  const { data } = await request.post<
    ApiSuccess<{ answer: string; sources: { concept: string; label: string }[] }>
  >('/ai-assist-items/ask', input);
  return data.data;
}

export async function explainWrong(input: ExplainWrongInput): Promise<{ explanation: string }> {
  const { data } = await request.post<ApiSuccess<{ explanation: string }>>(
    '/ai-assist-items/explain-wrong',
    input,
  );
  return data.data;
}

export async function essayFeedback(input: EssayFeedbackInput): Promise<{ feedback: string }> {
  const { data } = await request.post<ApiSuccess<{ feedback: string }>>(
    '/ai-assist-items/essay-feedback',
    input,
  );
  return data.data;
}

// UC-PLN-AI-01: biến một mục tiêu học tập thành lộ trình (Plan) đề xuất, học sinh xác nhận sau.
export async function generateStudyPlan(goalId: string): Promise<GeneratedStudyPlan> {
  const { data } = await request.post<ApiSuccess<GeneratedStudyPlan>>(ENDPOINTS.aiAssistItems.generatePlan, {
    goalId,
  });
  return data.data;
}

export async function listAiAssistLogs(filters: AiAssistFilters): Promise<ApiSuccess<AiAssistLog[]>> {
  const { data } = await request.get<ApiSuccess<AiAssistLog[]>>(ENDPOINTS.aiAssistItems.list, {
    params: filters,
  });
  return data;
}

export async function removeAiAssistLog(id: string): Promise<void> {
  await request.delete(ENDPOINTS.aiAssistItems.detail(id));
}

export async function rateAiAssistLog(id: string, rating: number, comment?: string): Promise<AiAssistLog> {
  const { data } = await request.post<ApiSuccess<AiAssistLog>>(`/ai-assist-items/${id}/rate`, {
    rating,
    comment,
  });
  return data.data;
}

export async function reportAiAssistLog(id: string, reason: string): Promise<AiAssistLog> {
  const { data } = await request.post<ApiSuccess<AiAssistLog>>(`/ai-assist-items/${id}/report`, { reason });
  return data.data;
}
