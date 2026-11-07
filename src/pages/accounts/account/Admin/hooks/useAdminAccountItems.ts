import { useQuery } from '@tanstack/react-query';
import { listAccountItems } from '@/services/account';
import { accountItemKeys } from '@/services/account/queryKeys';
import type { AccountItemFilters } from '@/services/account/types';

export function useAdminAccountItemList(filters: AccountItemFilters) {
  return useQuery({
    queryKey: accountItemKeys.list(filters),
    queryFn: () => listAccountItems(filters),
  });
}
