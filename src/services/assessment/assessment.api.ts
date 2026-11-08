import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { Assessment, AssessmentFilters, SubmitAssessmentInput } from './types';

export async function listAssessments(filters: AssessmentFilters): Promise<ApiSuccess<Assessment[]>> {
  const { data } = await request.get<ApiSuccess<Assessment[]>>(ENDPOINTS.assessmentItems.list, { params: filters });
  return data;
}

export async function startAssessment(assessmentConfig: string): Promise<Assessment> {
  const { data } = await request.post<ApiSuccess<Assessment>>(ENDPOINTS.assessmentItems.create, { assessmentConfig });
  return data.data;
}

export async function submitAssessment(id: string, input: SubmitAssessmentInput): Promise<Assessment> {
  const { data } = await request.patch<ApiSuccess<Assessment>>(ENDPOINTS.assessmentItems.submit(id), input);
  return data.data;
}
