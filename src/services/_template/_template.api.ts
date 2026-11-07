import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateTemplateItemInput, TemplateItem, TemplateItemFilters } from '@/services/_template/types';

export async function listTemplateItems(filters: TemplateItemFilters): Promise<ApiSuccess<TemplateItem[]>> {
  const { data } = await request.get<ApiSuccess<TemplateItem[]>>(ENDPOINTS.templateItems.list, { params: filters });
  return data;
}

export async function createTemplateItem(input: CreateTemplateItemInput): Promise<TemplateItem> {
  const { data } = await request.post<ApiSuccess<TemplateItem>>(ENDPOINTS.templateItems.create, input);
  return data.data;
}
