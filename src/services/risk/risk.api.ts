import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateRiskItemInput, RiskItem, RiskItemFilters, RiskItemStatus } from './types';

export async function listRiskItems(filters: RiskItemFilters): Promise<ApiSuccess<RiskItem[]>> {
  const { data } = await request.get<ApiSuccess<RiskItem[]>>(ENDPOINTS.riskItems.list, { params: filters });
  return data;
}

export async function createRiskItem(input: CreateRiskItemInput): Promise<RiskItem> {
  const { data } = await request.post<ApiSuccess<RiskItem>>(ENDPOINTS.riskItems.create, input);
  return data.data;
}

export async function updateRiskItemStatus(id: string, status: RiskItemStatus): Promise<RiskItem> {
  const { data } = await request.patch<ApiSuccess<RiskItem>>(ENDPOINTS.riskItems.updateStatus(id), {
    status,
  });
  return data.data;
}
