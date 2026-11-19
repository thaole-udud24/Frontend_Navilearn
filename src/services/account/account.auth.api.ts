import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  LoginPayload,
  LoginResponse,
  OtpPurpose,
  RegisterPayload,
  RegisterResult,
  ResetPasswordPayload,
  User,
  VerifyEmailPayload,
  VerifyResetOtpPayload,
} from './account.auth.types';

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await request.post<ApiSuccess<LoginResponse>>(ENDPOINTS.auth.login, payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const { data } = await request.post<ApiSuccess<RegisterResult>>(ENDPOINTS.auth.register, payload);
  return data.data;
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<LoginResponse> {
  const { data } = await request.post<ApiSuccess<LoginResponse>>(ENDPOINTS.auth.verifyEmail, payload);
  return data.data;
}

export async function resendOtp(email: string, purpose: OtpPurpose): Promise<void> {
  await request.post(ENDPOINTS.auth.resendOtp, { email, purpose });
}

export async function logout(refreshToken: string): Promise<void> {
  await request.post(ENDPOINTS.auth.logout, { refreshToken });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await request.post(ENDPOINTS.auth.forgotPassword, { email });
}

export async function verifyResetOtp(payload: VerifyResetOtpPayload): Promise<{ resetToken: string }> {
  const { data } = await request.post<ApiSuccess<{ resetToken: string }>>(ENDPOINTS.auth.verifyResetOtp, payload);
  return data.data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await request.post(ENDPOINTS.auth.resetPassword, payload);
}

export async function me(): Promise<User> {
  const { data } = await request.get<ApiSuccess<User>>(ENDPOINTS.auth.me);
  return data.data;
}
