import type { Role } from '@/constants/enums';

export type RbacAccess = 'none' | 'view' | 'manage' | 'own';

export interface RbacRole {
  code: Role;
  name: string;
  description: string;
  totalUsers: number;
  activeUsers: number;
}

export interface PermissionMatrixRow {
  module: string;
  capability: string;
  student: RbacAccess;
  admin: RbacAccess;
}

export interface MatrixFilters {
  role?: Role;
  module?: string;
  search?: string;
}

export interface EffectivePermission {
  module: string;
  capability: string;
  access: RbacAccess;
}

export interface EffectivePermissions {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    isActive: boolean;
    emailVerified: boolean;
  };
  permissions: EffectivePermission[];
}

export interface DeniedAccessLog {
  id: string;
  user: { id: string; email: string; fullName: string } | null;
  role: Role;
  method: string;
  path: string;
  requiredRoles: Role[];
  reason: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface DeniedLogFilters {
  page?: number;
  limit?: number;
  role?: Role;
  from?: string;
  to?: string;
}
