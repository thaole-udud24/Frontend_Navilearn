import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  Concept,
  ConceptFilters,
  ConceptStatus,
  CreateConceptInput,
  ImportRowResult,
  UpdateConceptInput,
} from './types';

export async function listConcepts(filters: ConceptFilters): Promise<ApiSuccess<Concept[]>> {
  const { data } = await request.get<ApiSuccess<Concept[]>>(ENDPOINTS.knowledgeItems.list, {
    params: filters,
  });
  return data;
}

export async function getConcept(id: string): Promise<Concept> {
  const { data } = await request.get<ApiSuccess<Concept>>(ENDPOINTS.knowledgeItems.detail(id));
  return data.data;
}

export async function createConcept(input: CreateConceptInput): Promise<Concept> {
  const { data } = await request.post<ApiSuccess<Concept>>(ENDPOINTS.knowledgeItems.create, input);
  return data.data;
}

export async function updateConceptStatus(id: string, status: ConceptStatus): Promise<Concept> {
  const { data } = await request.patch<ApiSuccess<Concept>>(ENDPOINTS.knowledgeItems.updateStatus(id), {
    status,
  });
  return data.data;
}

export async function updateConcept(id: string, input: UpdateConceptInput): Promise<Concept> {
  const { data } = await request.patch<ApiSuccess<Concept>>(ENDPOINTS.knowledgeItems.detail(id), input);
  return data.data;
}

/** Every leaf Concept under a subject (real cross-chapter prerequisite DAG), not one
 * parentConcept level at a time — see knowledge.service.getSubjectGraph for why. */
export async function getSubjectGraph(subjectId: string): Promise<ApiSuccess<Concept[]>> {
  const { data } = await request.get<ApiSuccess<Concept[]>>(ENDPOINTS.knowledgeItems.subjectGraph(subjectId));
  return data;
}

export async function removeConcept(id: string): Promise<void> {
  await request.delete(ENDPOINTS.knowledgeItems.detail(id));
}

export async function exportConcepts(): Promise<Concept[]> {
  const { data } = await request.get<ApiSuccess<Concept[]>>(ENDPOINTS.knowledgeItems.export);
  return data.data;
}

export async function importConcepts(items: Record<string, unknown>[]): Promise<ImportRowResult> {
  const { data } = await request.post<ApiSuccess<ImportRowResult>>(ENDPOINTS.knowledgeItems.import, {
    items,
  });
  return data.data;
}
