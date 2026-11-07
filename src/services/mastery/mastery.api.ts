import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateMasteryItemInput, MasteryItem, MasteryItemFilters } from './types';

export async function listMasteryItems(filters: MasteryItemFilters): Promise<ApiSuccess<MasteryItem[]>> {
  const { data } = await request.get<ApiSuccess<MasteryItem[]>>(ENDPOINTS.masteryItems.list, { params: filters });
  return data;
}

export async function createMasteryItem(input: CreateMasteryItemInput): Promise<MasteryItem> {
  const { data } = await request.post<ApiSuccess<MasteryItem>>(ENDPOINTS.masteryItems.create, input);
  return data.data;
}
