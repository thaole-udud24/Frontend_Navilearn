import type { DeniedLogFilters, MatrixFilters } from '@/services/account/account.rbac.types';

export const rbacItemKeys = {
  all: ['rbacItems'] as const,
  roles: () => [...rbacItemKeys.all, 'roles'] as const,
  matrix: (filters: MatrixFilters) => [...rbacItemKeys.all, 'matrix', filters] as const,
  effective: (id: string) => [...rbacItemKeys.all, 'effective', id] as const,
  denied: (filters: DeniedLogFilters) => [...rbacItemKeys.all, 'denied', filters] as const,
};
