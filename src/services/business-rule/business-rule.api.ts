import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateBusinessRuleItemInput, BusinessRuleItem, BusinessRuleItemFilters } from './types';

export async function listBusinessRuleItems(filters: BusinessRuleItemFilters): Promise<ApiSuccess<BusinessRuleItem[]>> {
  const { data } = await request.get<ApiSuccess<BusinessRuleItem[]>>(ENDPOINTS.businessRuleItems.list, { params: filters });
  return data;
}

export async function createBusinessRuleItem(input: CreateBusinessRuleItemInput): Promise<BusinessRuleItem> {
  const { data } = await request.post<ApiSuccess<BusinessRuleItem>>(ENDPOINTS.businessRuleItems.create, input);
  return data.data;
}
