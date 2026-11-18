import type { Role } from '@/constants/enums';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string | null;
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

/** Register no longer logs in: the email must be verified with an OTP first. */
export interface RegisterResult {
  email: string;
  requiresVerification: true;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export type OtpPurpose = 'verify' | 'reset';

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  password: string;
}
