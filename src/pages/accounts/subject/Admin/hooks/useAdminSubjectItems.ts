import { useQuery } from '@tanstack/react-query';
import { listSubjectItems } from '@/services/subject';
import { subjectItemKeys } from '@/services/subject/queryKeys';
import type { SubjectItemFilters } from '@/services/subject/types';

export function useAdminSubjectItemList(filters: SubjectItemFilters) {
  return useQuery({
    queryKey: subjectItemKeys.list(filters),
    queryFn: () => listSubjectItems(filters),
  });
}
