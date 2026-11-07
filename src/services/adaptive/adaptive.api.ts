import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateAdaptiveItemInput, AdaptiveItem, AdaptiveItemFilters } from './types';

export async function listAdaptiveItems(filters: AdaptiveItemFilters): Promise<ApiSuccess<AdaptiveItem[]>> {
  const { data } = await request.get<ApiSuccess<AdaptiveItem[]>>(ENDPOINTS.adaptiveItems.list, { params: filters });
  return data;
}

export async function createAdaptiveItem(input: CreateAdaptiveItemInput): Promise<AdaptiveItem> {
  const { data } = await request.post<ApiSuccess<AdaptiveItem>>(ENDPOINTS.adaptiveItems.create, input);
  return data.data;
}
