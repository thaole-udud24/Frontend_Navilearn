import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateAssessmentItemInput, AssessmentItem, AssessmentItemFilters } from './types';

export async function listAssessmentItems(filters: AssessmentItemFilters): Promise<ApiSuccess<AssessmentItem[]>> {
  const { data } = await request.get<ApiSuccess<AssessmentItem[]>>(ENDPOINTS.assessmentItems.list, { params: filters });
  return data;
}

export async function createAssessmentItem(input: CreateAssessmentItemInput): Promise<AssessmentItem> {
  const { data } = await request.post<ApiSuccess<AssessmentItem>>(ENDPOINTS.assessmentItems.create, input);
  return data.data;
}
