import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSubjectItem, listSubjectItems } from '@/services/subject';
import { subjectItemKeys } from '@/services/subject/queryKeys';
import type { CreateSubjectItemInput, SubjectItemFilters } from '@/services/subject/types';

export function useSubjectItemList(filters: SubjectItemFilters) {
  return useQuery({
    queryKey: subjectItemKeys.list(filters),
    queryFn: () => listSubjectItems(filters),
  });
}

export function useCreateSubjectItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubjectItemInput) => createSubjectItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectItemKeys.all }),
  });
}
