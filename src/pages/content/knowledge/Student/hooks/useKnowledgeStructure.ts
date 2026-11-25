import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { toApiError } from '@/services/apiError';
import { listStudentSubjects } from '@/services/student-subject';
import {
  applyKnowledgeTemplate,
  archiveKnowledgeNode,
  confirmKnowledgeProposal,
  createConceptNote,
  createKnowledgeNode,
  deleteConceptNote,
  generateKnowledgeProposal,
  getKnowledgeTree,
  listConceptNotes,
  listConcepts,
  listKnowledgeProposals,
  myKnowledgeKeys,
  rejectKnowledgeProposal,
  restoreKnowledgeNode,
  searchKnowledgeNodes,
  updateConceptNote,
  updateKnowledgeNode,
  type CreateNodeInput,
  type TreeFilters,
  type UpdateNodeInput,
} from '@/services/knowledge';

export function useMySubjects() {
  return useQuery({ queryKey: ['my-knowledge', 'subjects'], queryFn: () => listStudentSubjects({ limit: 100 }) });
}

export function useKnowledgeTree(subjectId: string, filters: TreeFilters) {
  return useQuery({
    queryKey: myKnowledgeKeys.tree(subjectId, { ...filters }),
    queryFn: () => getKnowledgeTree(subjectId, filters),
    enabled: !!subjectId,
    placeholderData: keepPreviousData,
  });
}

export function useKnowledgeSearch(subjectId: string, q: string) {
  return useQuery({
    queryKey: myKnowledgeKeys.search(subjectId, q),
    queryFn: () => searchKnowledgeNodes(subjectId, q),
    enabled: !!subjectId && q.length > 0,
  });
}

/** Shared top-level concepts (the sample structures students can apply). */
export function useSampleStructures(enabled: boolean) {
  return useQuery({
    queryKey: ['my-knowledge', 'samples'],
    queryFn: () => listConcepts({ parentConcept: 'null', limit: 100 }),
    enabled,
  });
}

export function useConceptNotes(nodeId: string | null) {
  return useQuery({
    queryKey: myKnowledgeKeys.notes(nodeId ?? ''),
    queryFn: () => listConceptNotes(nodeId as string),
    enabled: !!nodeId,
  });
}

export function useKnowledgeProposals(subjectId: string, enabled: boolean) {
  return useQuery({
    queryKey: myKnowledgeKeys.proposals(subjectId),
    queryFn: () => listKnowledgeProposals(subjectId),
    enabled: enabled && !!subjectId,
  });
}

/** Mutations for one course's structure. Each refreshes everything under `my-knowledge`. */
export function useStructureActions(subjectId: string) {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: myKnowledgeKeys.all });
  const options = (successMessage: string | null) => ({
    onSuccess: () => {
      refresh();
      if (successMessage) toast.success(successMessage);
    },
    onError: (error: unknown) => toast.error(toApiError(error).message),
  });

  return {
    createNode: useMutation({
      mutationFn: (input: CreateNodeInput) => createKnowledgeNode(subjectId, input),
      ...options('Đã thêm nút kiến thức'),
    }),
    updateNode: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateNodeInput }) => updateKnowledgeNode(id, input),
      ...options('Đã cập nhật'),
    }),
    archiveNode: useMutation({
      mutationFn: (id: string) => archiveKnowledgeNode(id),
      ...options('Đã ngừng sử dụng nút kiến thức'),
    }),
    restoreNode: useMutation({
      mutationFn: (id: string) => restoreKnowledgeNode(id),
      ...options('Đã khôi phục nút kiến thức'),
    }),
    applyTemplate: useMutation({
      mutationFn: (conceptId?: string) => applyKnowledgeTemplate(subjectId, conceptId),
      ...options(null),
    }),
    addNote: useMutation({
      mutationFn: ({ nodeId, content }: { nodeId: string; content: string }) => createConceptNote(nodeId, content),
      ...options('Đã thêm ghi chú'),
    }),
    editNote: useMutation({
      mutationFn: ({ id, content }: { id: string; content: string }) => updateConceptNote(id, content),
      ...options('Đã cập nhật ghi chú'),
    }),
    removeNote: useMutation({
      mutationFn: (id: string) => deleteConceptNote(id),
      ...options('Đã xóa ghi chú'),
    }),
    generateProposal: useMutation({
      mutationFn: (hint?: string) => generateKnowledgeProposal(subjectId, hint),
      ...options('AI đã đề xuất một cấu trúc. Hãy xem và xác nhận hoặc từ chối.'),
    }),
    confirmProposal: useMutation({
      mutationFn: (id: string) => confirmKnowledgeProposal(id),
      ...options('Đã thêm cấu trúc AI đề xuất vào môn học'),
    }),
    rejectProposal: useMutation({
      mutationFn: (id: string) => rejectKnowledgeProposal(id),
      ...options('Đã từ chối đề xuất'),
    }),
  };
}
