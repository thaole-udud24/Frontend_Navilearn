import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { WrongItem, WrongItemFilters } from './types';

export async function listWrongItems(filters: WrongItemFilters): Promise<ApiSuccess<WrongItem[]>> {
  const { data } = await request.get<ApiSuccess<WrongItem[]>>(ENDPOINTS.wrongItems.list, {
    params: filters,
  });
  return data;
}

export async function markWrongItemMastered(id: string): Promise<WrongItem> {
  const { data } = await request.post<ApiSuccess<WrongItem>>(ENDPOINTS.wrongItems.mastered(id));
  return data.data;
}
