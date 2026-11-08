import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { Mastery, MasteryFilters } from './types';

export async function listMasteries(filters: MasteryFilters): Promise<ApiSuccess<Mastery[]>> {
  const { data } = await request.get<ApiSuccess<Mastery[]>>(ENDPOINTS.masteryItems.list, { params: filters });
  return data;
}
