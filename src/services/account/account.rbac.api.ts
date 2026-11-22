import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  DeniedAccessLog,
  DeniedLogFilters,
  EffectivePermissions,
  MatrixFilters,
  PermissionMatrixRow,
  RbacRole,
} from './account.rbac.types';

export async function listRbacRoles(): Promise<RbacRole[]> {
  const { data } = await request.get<ApiSuccess<RbacRole[]>>(ENDPOINTS.rbacItems.roles);
  return data.data;
}

export async function getPermissionMatrix(filters: MatrixFilters): Promise<PermissionMatrixRow[]> {
  const { data } = await request.get<ApiSuccess<PermissionMatrixRow[]>>(ENDPOINTS.rbacItems.matrix, {
    params: filters,
  });
  return data.data;
}

export async function getEffectivePermissions(userId: string): Promise<EffectivePermissions> {
  const { data } = await request.get<ApiSuccess<EffectivePermissions>>(ENDPOINTS.rbacItems.effective(userId));
  return data.data;
}

export async function listDeniedAccessLogs(
  filters: DeniedLogFilters,
): Promise<ApiSuccess<DeniedAccessLog[]>> {
  const { data } = await request.get<ApiSuccess<DeniedAccessLog[]>>(ENDPOINTS.rbacItems.deniedLogs, {
    params: filters,
  });
  return data;
}

export async function exportPermissionMatrix(filters: MatrixFilters): Promise<void> {
  const { data } = await request.get<Blob>(ENDPOINTS.rbacItems.export, {
    params: filters,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rbac-permission-matrix.csv';
  link.click();
  URL.revokeObjectURL(url);
}
