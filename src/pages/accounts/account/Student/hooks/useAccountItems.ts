import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAccountItem, listAccountItems } from '@/services/account';
import { accountItemKeys } from '@/services/account/queryKeys';
import type { CreateAccountItemInput, AccountItemFilters } from '@/services/account/types';

export function useAccountItemList(filters: AccountItemFilters) {
  return useQuery({
    queryKey: accountItemKeys.list(filters),
    queryFn: () => listAccountItems(filters),
  });
}

export function useCreateAccountItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountItemInput) => createAccountItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountItemKeys.all }),
  });
}
