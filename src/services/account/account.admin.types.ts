import type { Role } from '@/constants/enums';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  lockReason: string | null;
  lockedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export type AdminUserStatus = 'active' | 'locked' | 'unverified';

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  status?: AdminUserStatus;
}

export interface CreateAdminUserInput {
  email: string;
  fullName: string;
  role: Role;
  password: string;
}

export interface UpdateAdminUserInput {
  email?: string;
  fullName?: string;
  role?: Role;
}

export interface LoginLogEntry {
  id: string;
  success: boolean;
  reason: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  meta: Record<string, unknown>;
  actor: { id: string; email: string; fullName: string } | null;
  createdAt: string;
}
