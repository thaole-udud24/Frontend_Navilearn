import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { toApiError } from '@/services/apiError';
import {
  deleteDocument,
  downloadDocument,
  getSubject,
  listDocuments,
  listUploads,
  replaceDocumentFile,
  subjectKeys,
  updateDocument,
  uploadDocument,
  type DocumentFilters,
  type DocumentMetaInput,
  type SubjectDocument,
} from '@/services/subject';

export function useSubject(subjectId: string) {
  return useQuery({ queryKey: subjectKeys.detail(subjectId), queryFn: () => getSubject(subjectId) });
}

export function useDocumentList(subjectId: string, filters: DocumentFilters) {
  return useQuery({
    queryKey: subjectKeys.documents(subjectId, filters),
    queryFn: () => listDocuments(subjectId, filters),
    placeholderData: keepPreviousData,
  });
}

export function useUploadHistory(subjectId: string, filters: DocumentFilters, enabled: boolean) {
  return useQuery({
    queryKey: subjectKeys.uploads(subjectId, filters),
    queryFn: () => listUploads(subjectId, filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** Mutations for one subject's documents. Each refreshes the subject queries (lists, counts, uploads). */
export function useDocumentActions(subjectId: string) {
  const queryClient = useQueryClient();
  const options = (successMessage: string) => ({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.all });
      toast.success(successMessage);
    },
    onError: (error: unknown) => toast.error(toApiError(error).message),
  });

  return {
    upload: useMutation({
      mutationFn: ({ file, meta }: { file: File; meta: DocumentMetaInput }) => uploadDocument(subjectId, file, meta),
      ...options('Đã tải tài liệu lên. Tài liệu đang chờ trích xuất.'),
    }),
    update: useMutation({
      mutationFn: ({ id, meta }: { id: string; meta: DocumentMetaInput }) => updateDocument(subjectId, id, meta),
      ...options('Đã cập nhật tài liệu'),
    }),
    replaceFile: useMutation({
      mutationFn: ({ id, file }: { id: string; file: File }) => replaceDocumentFile(subjectId, id, file),
      ...options('Đã thay thế tệp bằng phiên bản mới'),
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteDocument(subjectId, id),
      ...options('Đã xóa tài liệu'),
    }),
    download: (doc: SubjectDocument) =>
      downloadDocument(subjectId, doc).catch((error: unknown) => toast.error(toApiError(error).message)),
  };
}
