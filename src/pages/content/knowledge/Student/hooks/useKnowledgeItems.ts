import { useQuery } from '@tanstack/react-query';
import { listConcepts } from '@/services/knowledge';
import { conceptKeys } from '@/services/knowledge/queryKeys';
import type { ConceptFilters } from '@/services/knowledge/types';

export function useConceptList(filters: ConceptFilters) {
  return useQuery({
    queryKey: conceptKeys.list(filters),
    queryFn: () => listConcepts(filters),
  });
}
