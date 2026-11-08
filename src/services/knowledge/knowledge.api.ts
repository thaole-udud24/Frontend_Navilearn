import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { Concept, ConceptFilters, CreateConceptInput } from './types';

export async function listConcepts(filters: ConceptFilters): Promise<ApiSuccess<Concept[]>> {
  const { data } = await request.get<ApiSuccess<Concept[]>>(ENDPOINTS.knowledgeItems.list, { params: filters });
  return data;
}

export async function createConcept(input: CreateConceptInput): Promise<Concept> {
  const { data } = await request.post<ApiSuccess<Concept>>(ENDPOINTS.knowledgeItems.create, input);
  return data.data;
}

export async function archiveConcept(id: string): Promise<Concept> {
  const { data } = await request.patch<ApiSuccess<Concept>>(ENDPOINTS.knowledgeItems.updateStatus(id), {
    status: 'archived',
  });
  return data.data;
}
