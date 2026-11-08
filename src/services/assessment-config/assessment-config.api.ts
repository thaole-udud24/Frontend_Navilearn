import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { AssessmentConfig, AssessmentConfigFilters, CreateAssessmentConfigInput } from './types';

export async function listAssessmentConfigs(filters: AssessmentConfigFilters): Promise<ApiSuccess<AssessmentConfig[]>> {
  const { data } = await request.get<ApiSuccess<AssessmentConfig[]>>(ENDPOINTS.assessmentConfigItems.list, {
    params: filters,
  });
  return data;
}

export async function getAssessmentConfig(id: string): Promise<AssessmentConfig> {
  const { data } = await request.get<ApiSuccess<AssessmentConfig>>(ENDPOINTS.assessmentConfigItems.detail(id));
  return data.data;
}

export async function createAssessmentConfig(input: CreateAssessmentConfigInput): Promise<AssessmentConfig> {
  const { data } = await request.post<ApiSuccess<AssessmentConfig>>(ENDPOINTS.assessmentConfigItems.create, input);
  return data.data;
}

export async function archiveAssessmentConfig(id: string): Promise<AssessmentConfig> {
  const { data } = await request.patch<ApiSuccess<AssessmentConfig>>(ENDPOINTS.assessmentConfigItems.updateStatus(id), {
    status: 'archived',
  });
  return data.data;
}
