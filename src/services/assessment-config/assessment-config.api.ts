import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateAssessmentConfigItemInput, AssessmentConfigItem, AssessmentConfigItemFilters } from './types';

export async function listAssessmentConfigItems(filters: AssessmentConfigItemFilters): Promise<ApiSuccess<AssessmentConfigItem[]>> {
  const { data } = await request.get<ApiSuccess<AssessmentConfigItem[]>>(ENDPOINTS.assessmentConfigItems.list, { params: filters });
  return data;
}

export async function createAssessmentConfigItem(input: CreateAssessmentConfigItemInput): Promise<AssessmentConfigItem> {
  const { data } = await request.post<ApiSuccess<AssessmentConfigItem>>(ENDPOINTS.assessmentConfigItems.create, input);
  return data.data;
}
