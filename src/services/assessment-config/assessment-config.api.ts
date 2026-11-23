import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  AssessmentConfig,
  AssessmentConfigFilters,
  AssessmentConfigItem,
  AssessmentConfigItemFilters,
  CreateAssessmentConfigInput,
  CreateAssessmentConfigItemInput,
  CreateRubricInput,
  ImportRowResult,
  Rubric,
  RubricFilters,
  UpdateAssessmentConfigInput,
  UpdatePolicyInput,
  UpdateRubricInput,
} from './types';

export async function listAssessmentConfigItems(
  filters: AssessmentConfigItemFilters,
): Promise<ApiSuccess<AssessmentConfigItem[]>> {
  const { data } = await request.get<ApiSuccess<AssessmentConfigItem[]>>(
    ENDPOINTS.assessmentConfigItems.list,
    { params: filters },
  );
  return data;
}

export async function createAssessmentConfigItem(
  input: CreateAssessmentConfigItemInput,
): Promise<AssessmentConfigItem> {
  const { data } = await request.post<ApiSuccess<AssessmentConfigItem>>(
    ENDPOINTS.assessmentConfigItems.create,
    input,
  );
  return data.data;
}

export async function getAssessmentConfig(id: string): Promise<AssessmentConfig> {
  const { data } = await request.get<ApiSuccess<AssessmentConfig>>(
    ENDPOINTS.assessmentConfigItems.detail(id),
  );
  return data.data;
}

export async function listAssessmentConfigs(
  filters: AssessmentConfigFilters,
): Promise<ApiSuccess<AssessmentConfig[]>> {
  const { data } = await request.get<ApiSuccess<AssessmentConfig[]>>(ENDPOINTS.assessmentConfigItems.list, {
    params: filters,
  });
  return data;
}

export async function createAssessmentConfig(input: CreateAssessmentConfigInput): Promise<AssessmentConfig> {
  const { data } = await request.post<ApiSuccess<AssessmentConfig>>(
    ENDPOINTS.assessmentConfigItems.create,
    input,
  );
  return data.data;
}

export async function archiveAssessmentConfig(id: string): Promise<AssessmentConfig> {
  const { data } = await request.patch<ApiSuccess<AssessmentConfig>>(
    ENDPOINTS.assessmentConfigItems.updateStatus(id),
    {
      status: 'archived',
    },
  );
  return data.data;
}

export async function restoreAssessmentConfig(id: string): Promise<AssessmentConfig> {
  const { data } = await request.patch<ApiSuccess<AssessmentConfig>>(
    ENDPOINTS.assessmentConfigItems.updateStatus(id),
    {
      status: 'active',
    },
  );
  return data.data;
}

export async function updateAssessmentConfig(
  id: string,
  input: UpdateAssessmentConfigInput,
): Promise<AssessmentConfig> {
  const { data } = await request.patch<ApiSuccess<AssessmentConfig>>(
    ENDPOINTS.assessmentConfigItems.detail(id),
    input,
  );
  return data.data;
}

export async function updateAssessmentConfigPolicy(
  id: string,
  input: UpdatePolicyInput,
): Promise<AssessmentConfig> {
  const { data } = await request.patch<ApiSuccess<AssessmentConfig>>(
    ENDPOINTS.assessmentConfigItems.updatePolicy(id),
    input,
  );
  return data.data;
}

export async function duplicateAssessmentConfig(id: string): Promise<AssessmentConfig> {
  const { data } = await request.post<ApiSuccess<AssessmentConfig>>(
    ENDPOINTS.assessmentConfigItems.duplicate(id),
  );
  return data.data;
}

export async function removeAssessmentConfig(id: string): Promise<void> {
  await request.delete(ENDPOINTS.assessmentConfigItems.detail(id));
}

export async function listRubrics(filters: RubricFilters): Promise<ApiSuccess<Rubric[]>> {
  const { data } = await request.get<ApiSuccess<Rubric[]>>(ENDPOINTS.assessmentConfigItems.rubrics, {
    params: filters,
  });
  return data;
}

export async function getRubric(id: string): Promise<Rubric> {
  const { data } = await request.get<ApiSuccess<Rubric>>(ENDPOINTS.assessmentConfigItems.rubric(id));
  return data.data;
}

export async function createRubric(input: CreateRubricInput): Promise<Rubric> {
  const { data } = await request.post<ApiSuccess<Rubric>>(ENDPOINTS.assessmentConfigItems.rubrics, input);
  return data.data;
}

export async function updateRubric(id: string, input: UpdateRubricInput): Promise<Rubric> {
  const { data } = await request.patch<ApiSuccess<Rubric>>(ENDPOINTS.assessmentConfigItems.rubric(id), input);
  return data.data;
}

export async function updateRubricStatus(id: string, status: 'active' | 'archived'): Promise<Rubric> {
  const { data } = await request.patch<ApiSuccess<Rubric>>(ENDPOINTS.assessmentConfigItems.rubricStatus(id), {
    status,
  });
  return data.data;
}

export async function exportAssessmentConfigs(): Promise<AssessmentConfig[]> {
  const { data } = await request.get<ApiSuccess<AssessmentConfig[]>>(ENDPOINTS.assessmentConfigItems.export);
  return data.data;
}

export async function importAssessmentConfigs(items: Record<string, unknown>[]): Promise<ImportRowResult> {
  const { data } = await request.post<ApiSuccess<ImportRowResult>>(ENDPOINTS.assessmentConfigItems.import, {
    items,
  });
  return data.data;
}

export async function exportRubrics(): Promise<Rubric[]> {
  const { data } = await request.get<ApiSuccess<Rubric[]>>(ENDPOINTS.assessmentConfigItems.rubricsExport);
  return data.data;
}

export async function importRubrics(items: Record<string, unknown>[]): Promise<ImportRowResult> {
  const { data } = await request.post<ApiSuccess<ImportRowResult>>(
    ENDPOINTS.assessmentConfigItems.rubricsImport,
    { items },
  );
  return data.data;
}
