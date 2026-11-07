import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateRiskItemInput, RiskItem, RiskItemFilters } from './types';

export async function listRiskItems(filters: RiskItemFilters): Promise<ApiSuccess<RiskItem[]>> {
  const { data } = await request.get<ApiSuccess<RiskItem[]>>(ENDPOINTS.riskItems.list, { params: filters });
  return data;
}

export async function createRiskItem(input: CreateRiskItemInput): Promise<RiskItem> {
  const { data } = await request.post<ApiSuccess<RiskItem>>(ENDPOINTS.riskItems.create, input);
  return data.data;
}
