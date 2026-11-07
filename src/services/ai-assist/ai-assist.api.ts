import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateAiAssistItemInput, AiAssistItem, AiAssistItemFilters } from './types';

export async function listAiAssistItems(filters: AiAssistItemFilters): Promise<ApiSuccess<AiAssistItem[]>> {
  const { data } = await request.get<ApiSuccess<AiAssistItem[]>>(ENDPOINTS.aiAssistItems.list, { params: filters });
  return data;
}

export async function createAiAssistItem(input: CreateAiAssistItemInput): Promise<AiAssistItem> {
  const { data } = await request.post<ApiSuccess<AiAssistItem>>(ENDPOINTS.aiAssistItems.create, input);
  return data.data;
}
