import type { RbacItemFilters } from '@/services/account/account.rbac.types';

export const rbacItemKeys = {
  all: ['rbacItems'] as const,
  list: (filters: RbacItemFilters) => [...rbacItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...rbacItemKeys.all, 'detail', id] as const,
};
