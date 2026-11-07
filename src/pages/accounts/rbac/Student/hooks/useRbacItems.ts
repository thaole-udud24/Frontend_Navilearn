import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRbacItem, listRbacItems } from '@/services/account';
import { rbacItemKeys } from '@/services/account/account.rbac.queryKeys';
import type { CreateRbacItemInput, RbacItemFilters } from '@/services/account/account.rbac.types';

export function useRbacItemList(filters: RbacItemFilters) {
  return useQuery({
    queryKey: rbacItemKeys.list(filters),
    queryFn: () => listRbacItems(filters),
  });
}

export function useCreateRbacItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRbacItemInput) => createRbacItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rbacItemKeys.all }),
  });
}
