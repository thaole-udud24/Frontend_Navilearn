import { useQuery } from '@tanstack/react-query';
import { listRbacItems } from '@/services/account';
import { rbacItemKeys } from '@/services/account/account.rbac.queryKeys';
import type { RbacItemFilters } from '@/services/account/account.rbac.types';

export function useAdminRbacItemList(filters: RbacItemFilters) {
  return useQuery({
    queryKey: rbacItemKeys.list(filters),
    queryFn: () => listRbacItems(filters),
  });
}
