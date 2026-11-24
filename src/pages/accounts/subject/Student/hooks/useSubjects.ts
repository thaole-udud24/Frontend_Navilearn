import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { toApiError } from '@/services/apiError';
import {
  archiveSubject,
  catalogKeys,
  createSubject,
  createSubjectFromCatalog,
  deleteSubject,
  listCatalog,
  listSubjects,
  reorderSubjects,
  restoreSubject,
  setSubjectPinned,
  subjectKeys,
  updateSubject,
  type CatalogFilters,
  type SubjectFilters,
  type SubjectInput,
} from '@/services/subject';

export function useSubjectList(filters: SubjectFilters) {
  return useQuery({
    queryKey: subjectKeys.list(filters),
    queryFn: () => listSubjects(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCatalogList(filters: CatalogFilters, enabled = true) {
  return useQuery({
    queryKey: catalogKeys.list(filters),
    queryFn: () => listCatalog(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** Runs a subject mutation, then refreshes every subject query and reports the outcome with a toast. */
function useSubjectMutation<TVars, TData>(run: (vars: TVars) => Promise<TData>, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.all });
      toast.success(successMessage);
    },
    onError: (error) => toast.error(toApiError(error).message),
  });
}

export function useSubjectActions() {
  return {
    create: useSubjectMutation((input: SubjectInput) => createSubject(input), 'Đã thêm môn học'),
    createFromCatalog: useSubjectMutation(
      (catalogSubjectId: string) => createSubjectFromCatalog(catalogSubjectId),
      'Đã thêm môn học từ danh mục chung',
    ),
    update: useSubjectMutation(
      ({ id, input }: { id: string; input: SubjectInput }) => updateSubject(id, input),
      'Đã cập nhật môn học',
    ),
    pin: useSubjectMutation(
      ({ id, pinned }: { id: string; pinned: boolean }) => setSubjectPinned(id, pinned),
      'Đã cập nhật ghim',
    ),
    reorder: useSubjectMutation((ids: string[]) => reorderSubjects(ids), 'Đã sắp xếp lại môn học'),
    archive: useSubjectMutation((id: string) => archiveSubject(id), 'Đã lưu trữ môn học'),
    restore: useSubjectMutation((id: string) => restoreSubject(id), 'Đã khôi phục môn học'),
    remove: useSubjectMutation((id: string) => deleteSubject(id), 'Đã xóa môn học'),
  };
}
