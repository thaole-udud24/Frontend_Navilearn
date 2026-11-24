import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { toApiError } from '@/services/apiError';
import {
  catalogKeys,
  createCatalogSubject,
  deactivateCatalogSubject,
  downloadSharedDocument,
  importSharedDocuments,
  listCatalog,
  listSharedDocuments,
  removeSharedDocument,
  restoreCatalogSubject,
  sharedDocumentKeys,
  updateCatalogSubject,
  updateSharedDocument,
  uploadSharedDocument,
  type DocumentMetaInput,
  type ImportManifestRow,
  type SharedDocumentFilters,
  type SubjectDocument,
  type SubjectInput,
} from '@/services/subject';

/** Every subject in the catalog (active and inactive) — used by the document filters and pickers. */
export function useAllCatalogSubjects() {
  return useQuery({ queryKey: catalogKeys.list({ limit: 100 }), queryFn: () => listCatalog({ limit: 100 }) });
}

export function useSharedDocumentList(filters: SharedDocumentFilters) {
  return useQuery({
    queryKey: sharedDocumentKeys.list(filters),
    queryFn: () => listSharedDocuments(filters),
    placeholderData: keepPreviousData,
  });
}

/** Catalog mutations; `onDone` lets the table page refresh itself after a successful change. */
export function useCatalogActions(onDone: () => void) {
  const queryClient = useQueryClient();
  const options = (successMessage: string) => ({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      toast.success(successMessage);
      onDone();
    },
    onError: (error: unknown) => toast.error(toApiError(error).message),
  });

  return {
    create: useMutation({
      mutationFn: (input: SubjectInput) => createCatalogSubject(input),
      ...options('Đã thêm môn học vào danh mục chung'),
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: SubjectInput }) => updateCatalogSubject(id, input),
      ...options('Đã cập nhật môn học'),
    }),
    deactivate: useMutation({
      mutationFn: (id: string) => deactivateCatalogSubject(id),
      ...options('Đã ngừng sử dụng môn học'),
    }),
    restore: useMutation({
      mutationFn: (id: string) => restoreCatalogSubject(id),
      ...options('Đã khôi phục môn học'),
    }),
  };
}

/** Shared-library mutations; each one refreshes the lists and reports the outcome with a toast. */
export function useSharedDocumentActions() {
  const queryClient = useQueryClient();
  const options = (successMessage: string) => ({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sharedDocumentKeys.all });
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      toast.success(successMessage);
    },
    onError: (error: unknown) => toast.error(toApiError(error).message),
  });

  return {
    upload: useMutation({
      mutationFn: ({ subjectId, file, meta }: { subjectId: string; file: File; meta: DocumentMetaInput }) =>
        uploadSharedDocument(subjectId, file, meta),
      ...options('Đã tải tài liệu lên thư viện chung'),
    }),
    update: useMutation({
      mutationFn: ({ id, meta }: { id: string; meta: DocumentMetaInput }) => updateSharedDocument(id, meta),
      ...options('Đã cập nhật tài liệu'),
    }),
    remove: useMutation({
      mutationFn: (id: string) => removeSharedDocument(id),
      ...options('Đã gỡ tài liệu khỏi thư viện chung'),
    }),
    // No toast on success: the dialog shows the per-row report instead.
    importBulk: useMutation({
      mutationFn: ({ files, subjectId, manifest }: { files: File[]; subjectId: string; manifest: ImportManifestRow[] }) =>
        importSharedDocuments(files, subjectId, manifest),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: sharedDocumentKeys.all });
        void queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      },
      onError: (error: unknown) => toast.error(toApiError(error).message),
    }),
    download: (doc: SubjectDocument) =>
      downloadSharedDocument(doc).catch((error: unknown) => toast.error(toApiError(error).message)),
  };
}
