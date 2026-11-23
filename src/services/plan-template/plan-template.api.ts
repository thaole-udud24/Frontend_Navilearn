import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { Plan } from '@/services/planning/types';
import type {
  CreatePlanTemplateInput,
  ImportRowResult,
  PlanTemplate,
  PlanTemplateFilters,
  UpdatePlanTemplateInput,
} from './types';

// Danh sách lộ trình mẫu — sinh viên chỉ thấy mẫu đang mở (isActive), admin thấy toàn bộ (lọc ở backend)
export async function listPlanTemplates(
  filters: PlanTemplateFilters = {},
): Promise<ApiSuccess<PlanTemplate[]>> {
  const { data } = await request.get<ApiSuccess<PlanTemplate[]>>(ENDPOINTS.planTemplateItems.list, {
    params: filters,
  });
  return data;
}

export async function getPlanTemplate(id: string): Promise<PlanTemplate> {
  const { data } = await request.get<ApiSuccess<PlanTemplate>>(ENDPOINTS.planTemplateItems.detail(id));
  return data.data;
}

export async function createPlanTemplate(input: CreatePlanTemplateInput): Promise<PlanTemplate> {
  const { data } = await request.post<ApiSuccess<PlanTemplate>>(ENDPOINTS.planTemplateItems.create, input);
  return data.data;
}

export async function updatePlanTemplate(id: string, input: UpdatePlanTemplateInput): Promise<PlanTemplate> {
  const { data } = await request.patch<ApiSuccess<PlanTemplate>>(
    ENDPOINTS.planTemplateItems.update(id),
    input,
  );
  return data.data;
}

export async function removePlanTemplate(id: string): Promise<void> {
  await request.delete(ENDPOINTS.planTemplateItems.remove(id));
}

// UC-PLN-TPL-02: học sinh áp dụng lộ trình mẫu — kết quả là Plan 'proposed' giống luồng AI, chờ xác nhận.
export async function applyPlanTemplate(id: string, goalId?: string): Promise<Plan> {
  const { data } = await request.post<ApiSuccess<Plan>>(ENDPOINTS.planTemplateItems.apply(id), { goalId });
  return data.data;
}

export async function exportPlanTemplates(): Promise<PlanTemplate[]> {
  const { data } = await request.get<ApiSuccess<PlanTemplate[]>>(ENDPOINTS.planTemplateItems.export);
  return data.data;
}

export async function importPlanTemplates(items: Record<string, unknown>[]): Promise<ImportRowResult> {
  const { data } = await request.post<ApiSuccess<ImportRowResult>>(ENDPOINTS.planTemplateItems.import, {
    items,
  });
  return data.data;
}
