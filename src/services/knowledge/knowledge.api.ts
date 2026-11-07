import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateKnowledgeItemInput, KnowledgeItem, KnowledgeItemFilters } from './types';

export async function listKnowledgeItems(filters: KnowledgeItemFilters): Promise<ApiSuccess<KnowledgeItem[]>> {
  const { data } = await request.get<ApiSuccess<KnowledgeItem[]>>(ENDPOINTS.knowledgeItems.list, { params: filters });
  return data;
}

export async function createKnowledgeItem(input: CreateKnowledgeItemInput): Promise<KnowledgeItem> {
  const { data } = await request.post<ApiSuccess<KnowledgeItem>>(ENDPOINTS.knowledgeItems.create, input);
  return data.data;
}
