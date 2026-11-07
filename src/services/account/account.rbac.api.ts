import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateRbacItemInput, RbacItem, RbacItemFilters } from './account.rbac.types';

export async function listRbacItems(filters: RbacItemFilters): Promise<ApiSuccess<RbacItem[]>> {
  const { data } = await request.get<ApiSuccess<RbacItem[]>>(ENDPOINTS.rbacItems.list, { params: filters });
  return data;
}

export async function createRbacItem(input: CreateRbacItemInput): Promise<RbacItem> {
  const { data } = await request.post<ApiSuccess<RbacItem>>(ENDPOINTS.rbacItems.create, input);
  return data.data;
}
