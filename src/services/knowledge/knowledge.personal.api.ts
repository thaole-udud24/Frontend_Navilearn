import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  ApplyTemplateResult,
  ConceptNote,
  CopyStructureResult,
  CreateNodeInput,
  KnowledgeNode,
  KnowledgeProposal,
  KnowledgeTree,
  ProposalStatus,
  SearchResult,
  StructureReport,
  StructureStatusResult,
  TreeFilters,
  UpdateNodeInput,
} from './types';

// ---- student: structure ----
export async function getKnowledgeTree(subjectId: string, filters: TreeFilters = {}): Promise<KnowledgeTree> {
  const { data } = await request.get<ApiSuccess<KnowledgeTree>>(ENDPOINTS.myKnowledge.tree(subjectId), {
    params: filters,
  });
  return data.data;
}

export async function searchKnowledgeNodes(subjectId: string, q: string): Promise<SearchResult[]> {
  const { data } = await request.get<ApiSuccess<SearchResult[]>>(ENDPOINTS.myKnowledge.search(subjectId), {
    params: { q },
  });
  return data.data;
}

export async function createKnowledgeNode(subjectId: string, input: CreateNodeInput): Promise<KnowledgeNode> {
  const { data } = await request.post<ApiSuccess<KnowledgeNode>>(ENDPOINTS.myKnowledge.nodes(subjectId), input);
  return data.data;
}

export async function updateKnowledgeNode(id: string, input: UpdateNodeInput): Promise<KnowledgeNode> {
  const { data } = await request.patch<ApiSuccess<KnowledgeNode>>(ENDPOINTS.myKnowledge.node(id), input);
  return data.data;
}

export async function archiveKnowledgeNode(id: string): Promise<{ archivedCount: number }> {
  const { data } = await request.post<ApiSuccess<{ archivedCount: number }>>(ENDPOINTS.myKnowledge.archiveNode(id));
  return data.data;
}

export async function restoreKnowledgeNode(id: string): Promise<{ restoredCount: number }> {
  const { data } = await request.post<ApiSuccess<{ restoredCount: number }>>(ENDPOINTS.myKnowledge.restoreNode(id));
  return data.data;
}

export async function applyKnowledgeTemplate(subjectId: string, conceptId?: string): Promise<ApplyTemplateResult> {
  const { data } = await request.post<ApiSuccess<ApplyTemplateResult>>(
    ENDPOINTS.myKnowledge.applyTemplate(subjectId),
    conceptId ? { conceptId } : {},
  );
  return data.data;
}

// ---- student: notes ----
export async function listConceptNotes(nodeId: string): Promise<ConceptNote[]> {
  const { data } = await request.get<ApiSuccess<ConceptNote[]>>(ENDPOINTS.myKnowledge.notes, {
    params: { personalConcept: nodeId },
  });
  return data.data;
}

export async function createConceptNote(nodeId: string, content: string): Promise<ConceptNote> {
  const { data } = await request.post<ApiSuccess<ConceptNote>>(ENDPOINTS.myKnowledge.notes, {
    personalConcept: nodeId,
    content,
  });
  return data.data;
}

export async function updateConceptNote(id: string, content: string): Promise<ConceptNote> {
  const { data } = await request.patch<ApiSuccess<ConceptNote>>(ENDPOINTS.myKnowledge.note(id), { content });
  return data.data;
}

export async function deleteConceptNote(id: string): Promise<void> {
  await request.delete(ENDPOINTS.myKnowledge.note(id));
}

// ---- student: AI proposals ----
export async function listKnowledgeProposals(
  subjectId: string,
  status?: ProposalStatus,
): Promise<KnowledgeProposal[]> {
  const { data } = await request.get<ApiSuccess<KnowledgeProposal[]>>(ENDPOINTS.myKnowledge.proposals(subjectId), {
    params: status ? { status } : {},
  });
  return data.data;
}

export async function generateKnowledgeProposal(subjectId: string, hint?: string): Promise<KnowledgeProposal> {
  const { data } = await request.post<ApiSuccess<KnowledgeProposal>>(
    ENDPOINTS.myKnowledge.generateProposal(subjectId),
    hint ? { hint } : {},
  );
  return data.data;
}

export async function confirmKnowledgeProposal(id: string): Promise<KnowledgeProposal> {
  const { data } = await request.post<ApiSuccess<KnowledgeProposal>>(ENDPOINTS.myKnowledge.confirmProposal(id));
  return data.data;
}

export async function rejectKnowledgeProposal(id: string): Promise<KnowledgeProposal> {
  const { data } = await request.post<ApiSuccess<KnowledgeProposal>>(ENDPOINTS.myKnowledge.rejectProposal(id));
  return data.data;
}

// ---- admin: sample structures ----
export async function validateStructure(id: string): Promise<StructureReport> {
  const { data } = await request.get<ApiSuccess<StructureReport>>(ENDPOINTS.knowledgeItems.validate(id));
  return data.data;
}

export async function copyStructure(id: string, name?: string): Promise<CopyStructureResult> {
  const { data } = await request.post<ApiSuccess<CopyStructureResult>>(
    ENDPOINTS.knowledgeItems.copy(id),
    name ? { name } : {},
  );
  return data.data;
}

export async function deactivateStructure(id: string): Promise<StructureStatusResult> {
  const { data } = await request.post<ApiSuccess<StructureStatusResult>>(ENDPOINTS.knowledgeItems.deactivateTree(id));
  return data.data;
}

export async function restoreStructure(id: string): Promise<StructureStatusResult> {
  const { data } = await request.post<ApiSuccess<StructureStatusResult>>(ENDPOINTS.knowledgeItems.restoreTree(id));
  return data.data;
}
