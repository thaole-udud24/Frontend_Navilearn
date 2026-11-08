import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { archiveConcept, createConcept, listConcepts } from '@/services/knowledge';
import { conceptKeys } from '@/services/knowledge/queryKeys';
import type { ConceptFilters, CreateConceptInput } from '@/services/knowledge/types';

export function useAdminConceptList(filters: ConceptFilters) {
  return useQuery({
    queryKey: conceptKeys.list(filters),
    queryFn: () => listConcepts(filters),
  });
}

export function useCreateConcept() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConceptInput) => createConcept(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conceptKeys.all }),
  });
}

export function useArchiveConcept() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveConcept(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conceptKeys.all }),
  });
}
