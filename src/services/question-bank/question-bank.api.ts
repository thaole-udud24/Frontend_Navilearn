import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  CreateQuestionBankItemInput,
  CreateQuestionInput,
  DuplicateGroup,
  FromAiDraftInput,
  ImportRowResult,
  IssueReportFilters,
  Question,
  QuestionBankItem,
  QuestionBankItemFilters,
  QuestionFilters,
  QuestionIssueReport,
  QuestionQualityStat,
  UpdateQuestionInput,
} from './types';

export async function listQuestionBankItems(filters: QuestionBankItemFilters): Promise<ApiSuccess<QuestionBankItem[]>> {
  const { data } = await request.get<ApiSuccess<QuestionBankItem[]>>(ENDPOINTS.questionBankItems.list, { params: filters });
  return data;
}

export async function listQuestions(filters: QuestionFilters): Promise<ApiSuccess<Question[]>> {
  const { data } = await request.get<ApiSuccess<Question[]>>(ENDPOINTS.questionBankItems.list, { params: filters });
  return data;
}

export async function createQuestionBankItem(input: CreateQuestionBankItemInput): Promise<QuestionBankItem> {
  const { data } = await request.post<ApiSuccess<QuestionBankItem>>(ENDPOINTS.questionBankItems.create, input);
  return data.data;
}

export async function getQuestion(id: string): Promise<Question> {
  const { data } = await request.get<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.detail(id));
  return data.data;
}

export async function createQuestion(input: CreateQuestionInput): Promise<Question> {
  const { data } = await request.post<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.create, input);
  return data.data;
}

export async function reportQuestionIssue(
  id: string,
  input: { reason: string; description?: string },
): Promise<void> {
  await request.post(ENDPOINTS.questionBankItems.report(id), input);
}

export async function archiveQuestion(id: string): Promise<Question> {
  const { data } = await request.patch<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.updateStatus(id), {
    status: 'archived',
  });
  return data.data;
}

export async function restoreQuestion(id: string): Promise<Question> {
  const { data } = await request.patch<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.updateStatus(id), {
    status: 'active',
  });
  return data.data;
}

export async function updateQuestion(id: string, input: UpdateQuestionInput): Promise<Question> {
  const { data } = await request.patch<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.detail(id), input);
  return data.data;
}

export async function duplicateQuestion(id: string): Promise<Question> {
  const { data } = await request.post<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.duplicate(id));
  return data.data;
}

export async function removeQuestion(id: string): Promise<void> {
  await request.delete(ENDPOINTS.questionBankItems.detail(id));
}

export async function importQuestions(items: Record<string, unknown>[]): Promise<ImportRowResult> {
  const { data } = await request.post<ApiSuccess<ImportRowResult>>(ENDPOINTS.questionBankItems.import, { items });
  return data.data;
}

export async function exportQuestions(filters: { concept?: string; status?: string }): Promise<Question[]> {
  const { data } = await request.get<ApiSuccess<Question[]>>(ENDPOINTS.questionBankItems.export, { params: filters });
  return data.data;
}

export async function approveFromAiDraft(input: FromAiDraftInput): Promise<Question> {
  const { data } = await request.post<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.fromAiDraft, input);
  return data.data;
}

export async function getQualityStats(concept?: string): Promise<QuestionQualityStat[]> {
  const { data } = await request.get<ApiSuccess<QuestionQualityStat[]>>(ENDPOINTS.questionBankItems.qualityStats, {
    params: { concept },
  });
  return data.data;
}

export async function findDuplicateQuestions(concept?: string): Promise<DuplicateGroup[]> {
  const { data } = await request.get<ApiSuccess<DuplicateGroup[]>>(ENDPOINTS.questionBankItems.duplicates, {
    params: { concept },
  });
  return data.data;
}

export async function listIssueReports(filters: IssueReportFilters): Promise<ApiSuccess<QuestionIssueReport[]>> {
  const { data } = await request.get<ApiSuccess<QuestionIssueReport[]>>(ENDPOINTS.questionBankItems.issueReports, {
    params: filters,
  });
  return data;
}

export async function resolveIssueReport(
  id: string,
  input: { action: 'fix' | 'dismiss'; resolution?: string },
): Promise<QuestionIssueReport> {
  const { data } = await request.patch<ApiSuccess<QuestionIssueReport>>(ENDPOINTS.questionBankItems.issueReport(id), input);
  return data.data;
}

export async function previewRegradeImpact(id: string): Promise<{ questionId: string; affectedAttemptsCount: number }> {
  const { data } = await request.get<ApiSuccess<{ questionId: string; affectedAttemptsCount: number }>>(
    ENDPOINTS.questionBankItems.regradeImpact(id),
  );
  return data.data;
}

export async function confirmRegrade(id: string): Promise<{ questionId: string; regradedCount: number }> {
  const { data } = await request.post<ApiSuccess<{ questionId: string; regradedCount: number }>>(
    ENDPOINTS.questionBankItems.confirmRegrade(id),
  );
  return data.data;
}
