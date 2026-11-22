import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateSubjectItemInput, SubjectItem, SubjectItemFilters, SubjectItemStatus } from './types';

export async function listSubjectItems(filters: SubjectItemFilters): Promise<ApiSuccess<SubjectItem[]>> {
  const { data } = await request.get<ApiSuccess<SubjectItem[]>>(ENDPOINTS.subjectItems.list, { params: filters });
  return data;
}

export async function createSubjectItem(input: CreateSubjectItemInput): Promise<SubjectItem> {
  const { data } = await request.post<ApiSuccess<SubjectItem>>(ENDPOINTS.subjectItems.create, input);
  return data.data;
}

export async function updateSubjectItemStatus(id: string, status: SubjectItemStatus): Promise<SubjectItem> {
  const { data } = await request.patch<ApiSuccess<SubjectItem>>(ENDPOINTS.subjectItems.updateStatus(id), { status });
  return data.data;
}
