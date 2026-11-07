// Demo-only mock auth backend. account.auth.client.ts falls back to this when the real
// API is unreachable (backend down / no network), so the AuthPage always demos.
import { ROLES } from '@/constants/enums';
import type { LoginPayload, LoginResponse, RegisterPayload, User } from './account.auth.types';

function delay<T>(value: T, ms = 1000): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let mockSeq = 1;

function toUser(email: string, fullName: string): User {
  const role = email.toLowerCase().includes('admin') ? ROLES.ADMIN : ROLES.STUDENT;
  return { id: `mock-${mockSeq++}`, email, fullName, role };
}

export async function mockLogin(payload: LoginPayload): Promise<LoginResponse> {
  await delay(null);
  if (payload.password.length < 6) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }
  const user = toUser(payload.email, payload.email.split('@')[0] || 'Người dùng');
  return { user, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' };
}

export async function mockRegister(payload: RegisterPayload): Promise<LoginResponse> {
  await delay(null);
  if (payload.email.toLowerCase() === 'taken@test.com') {
    throw new Error('Email này đã được sử dụng');
  }
  // Mock always creates a student account, same as the real backend default.
  const user: User = { id: `mock-${mockSeq++}`, email: payload.email, fullName: payload.fullName, role: ROLES.STUDENT };
  return { user, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' };
}

export async function mockRequestPasswordReset(_email: string): Promise<{ sent: true }> {
  await delay(null);
  return { sent: true };
}

export async function mockResetPassword(_password: string): Promise<{ success: true }> {
  await delay(null);
  return { success: true };
}

export async function mockVerifyOtp(otp: string): Promise<{ success: true }> {
  await delay(null);
  if (otp.length !== 6) throw new Error('Mã OTP không hợp lệ');
  return { success: true };
}
