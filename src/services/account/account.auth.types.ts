import type { Role } from '@/constants/enums';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// No `role` field: the backend always defaults new accounts to student (account.auth.model.js).
export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}
