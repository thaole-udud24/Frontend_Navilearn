import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreatePlanningItemInput, PlanningItem, PlanningItemFilters } from './types';

export async function listPlanningItems(filters: PlanningItemFilters): Promise<ApiSuccess<PlanningItem[]>> {
  const { data } = await request.get<ApiSuccess<PlanningItem[]>>(ENDPOINTS.planningItems.list, { params: filters });
  return data;
}

export async function createPlanningItem(input: CreatePlanningItemInput): Promise<PlanningItem> {
  const { data } = await request.post<ApiSuccess<PlanningItem>>(ENDPOINTS.planningItems.create, input);
  return data.data;
}
