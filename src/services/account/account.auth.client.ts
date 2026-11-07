// AuthPage's API entry point: tries the real backend first, and falls back to the mock
// implementation ONLY on a network-level failure (backend unreachable), never on a real
// HTTP error response (401 wrong password, 409 email taken, ...) — that's a legitimate
// answer from a running backend and must reach the user as-is.
import axios from 'axios';
import { login as realLogin, register as realRegister } from './account.auth.api';
import { mockLogin, mockRegister, mockRequestPasswordReset, mockResetPassword, mockVerifyOtp } from './account.auth.mock';
import type { LoginPayload, LoginResponse, RegisterPayload } from './account.auth.types';

// axios surfaces a connection-refused/no-network failure as an AxiosError with no `response`
// (the request never got a reply); an HTTP error status (4xx/5xx) always has `error.response`.
function isNetworkFailure(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    return await realLogin(payload);
  } catch (error) {
    if (isNetworkFailure(error)) return mockLogin(payload);
    throw error;
  }
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  try {
    return await realRegister(payload);
  } catch (error) {
    if (isNetworkFailure(error)) return mockRegister(payload);
    throw error;
  }
}

// No real endpoints exist yet for these (backend_navilearn has no forgot/reset/otp routes),
// so the demo flow always goes through the mock here.
export const requestPasswordReset = mockRequestPasswordReset;
export const resetPassword = mockResetPassword;
export const verifyOtp = mockVerifyOtp;
