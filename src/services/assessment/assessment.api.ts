import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  Assessment,
  AssessmentFilters,
  AssessmentItem,
  AssessmentItemFilters,
  CompareResult,
  CreateAssessmentItemInput,
  ScoreHistoryEntry,
  SubmitAssessmentInput,
} from './types';

export async function listAssessmentItems(
  filters: AssessmentItemFilters,
): Promise<ApiSuccess<AssessmentItem[]>> {
  const { data } = await request.get<ApiSuccess<AssessmentItem[]>>(ENDPOINTS.assessmentItems.list, {
    params: filters,
  });
  return data;
}

export async function listAssessments(filters: AssessmentFilters): Promise<ApiSuccess<Assessment[]>> {
  const { data } = await request.get<ApiSuccess<Assessment[]>>(ENDPOINTS.assessmentItems.list, {
    params: filters,
  });
  return data;
}

export async function createAssessmentItem(input: CreateAssessmentItemInput): Promise<AssessmentItem> {
  const { data } = await request.post<ApiSuccess<AssessmentItem>>(ENDPOINTS.assessmentItems.create, input);
  return data.data;
}

export async function getAssessment(id: string): Promise<Assessment> {
  const { data } = await request.get<ApiSuccess<Assessment>>(ENDPOINTS.assessmentItems.detail(id));
  return data.data;
}

export async function startAssessment(assessmentConfig: string): Promise<Assessment> {
  const { data } = await request.post<ApiSuccess<Assessment>>(ENDPOINTS.assessmentItems.create, {
    assessmentConfig,
  });
  return data.data;
}

export async function submitAssessment(id: string, input: SubmitAssessmentInput): Promise<Assessment> {
  const { data } = await request.patch<ApiSuccess<Assessment>>(ENDPOINTS.assessmentItems.submit(id), input);
  return data.data;
}

export async function saveAssessmentDraft(id: string, input: SubmitAssessmentInput): Promise<Assessment> {
  const { data } = await request.patch<ApiSuccess<Assessment>>(ENDPOINTS.assessmentItems.draft(id), input);
  return data.data;
}

export async function setAssessmentFlag(id: string, question: string, flagged: boolean): Promise<Assessment> {
  const { data } = await request.patch<ApiSuccess<Assessment>>(ENDPOINTS.assessmentItems.flag(id), {
    question,
    flagged,
  });
  return data.data;
}

export async function getWrongAnswers(
  id: string,
): Promise<{ assessment: string; concept: string; wrongAnswers: Assessment['answers'] }> {
  const { data } = await request.get<
    ApiSuccess<{ assessment: string; concept: string; wrongAnswers: Assessment['answers'] }>
  >(ENDPOINTS.assessmentItems.wrongAnswers(id));
  return data.data;
}

export async function getScoreHistory(id: string): Promise<ScoreHistoryEntry[]> {
  const { data } = await request.get<ApiSuccess<ScoreHistoryEntry[]>>(
    ENDPOINTS.assessmentItems.scoreHistory(id),
  );
  return data.data;
}

export async function compareAttempts(concept: string): Promise<CompareResult> {
  const { data } = await request.get<ApiSuccess<CompareResult>>(ENDPOINTS.assessmentItems.compare, {
    params: { concept },
  });
  return data.data;
}

export async function startRetryWrong(previousAttemptId: string): Promise<Assessment> {
  const { data } = await request.post<ApiSuccess<Assessment>>(ENDPOINTS.assessmentItems.retryWrong, {
    previousAttemptId,
  });
  return data.data;
}

export async function startIndependentCheck(concept: string): Promise<Assessment> {
  const { data } = await request.post<ApiSuccess<Assessment>>(ENDPOINTS.assessmentItems.independentCheck, {
    concept,
  });
  return data.data;
}
