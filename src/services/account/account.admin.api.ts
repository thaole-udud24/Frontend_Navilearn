import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  AdminUser,
  AdminUserFilters,
  CreateAdminUserInput,
  LoginLogEntry,
  UpdateAdminUserInput,
} from './account.admin.types';

export async function listUsers(filters: AdminUserFilters): Promise<ApiSuccess<AdminUser[]>> {
  const { data } = await request.get<ApiSuccess<AdminUser[]>>(ENDPOINTS.adminUsers.list, { params: filters });
  return data;
}

export async function createUser(input: CreateAdminUserInput): Promise<AdminUser> {
  const { data } = await request.post<ApiSuccess<AdminUser>>(ENDPOINTS.adminUsers.list, input);
  return data.data;
}

export async function updateUser(id: string, input: UpdateAdminUserInput): Promise<AdminUser> {
  const { data } = await request.patch<ApiSuccess<AdminUser>>(ENDPOINTS.adminUsers.detail(id), input);
  return data.data;
}

export async function lockUser(id: string, reason: string): Promise<AdminUser> {
  const { data } = await request.post<ApiSuccess<AdminUser>>(ENDPOINTS.adminUsers.lock(id), { reason });
  return data.data;
}

export async function unlockUser(id: string): Promise<AdminUser> {
  const { data } = await request.post<ApiSuccess<AdminUser>>(ENDPOINTS.adminUsers.unlock(id));
  return data.data;
}

export async function removeUser(id: string): Promise<void> {
  await request.delete(ENDPOINTS.adminUsers.detail(id));
}

export async function sendResetLink(id: string): Promise<void> {
  await request.post(ENDPOINTS.adminUsers.sendReset(id));
}

export async function listLoginLogs(id: string, page = 1): Promise<ApiSuccess<LoginLogEntry[]>> {
  const { data } = await request.get<ApiSuccess<LoginLogEntry[]>>(ENDPOINTS.adminUsers.loginLogs(id), {
    params: { page, limit: 10 },
  });
  return data;
}

/** Downloads the filtered user list as a CSV file. */
export async function exportUsers(filters: AdminUserFilters): Promise<void> {
  const { data } = await request.get<Blob>(ENDPOINTS.adminUsers.export, {
    params: { search: filters.search, role: filters.role, status: filters.status },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'users.csv';
  link.click();
  URL.revokeObjectURL(url);
}
