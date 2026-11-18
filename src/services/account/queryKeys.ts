import type { AdminUserFilters } from './account.admin.types';

export const accountKeys = {
  profile: ['account', 'profile'] as const,
  sessions: ['account', 'sessions'] as const,
  users: ['account', 'users'] as const,
  userList: (filters: AdminUserFilters) => ['account', 'users', 'list', filters] as const,
  loginLogs: (id: string, page: number) => ['account', 'users', id, 'login-logs', page] as const,
};
