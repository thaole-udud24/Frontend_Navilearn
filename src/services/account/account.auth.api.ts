import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { LoginPayload, LoginResponse, RegisterPayload, User } from './account.auth.types';

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await request.post<ApiSuccess<LoginResponse>>(ENDPOINTS.auth.login, payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  const { data } = await request.post<ApiSuccess<LoginResponse>>(ENDPOINTS.auth.register, payload);
  return data.data;
}

export async function me(): Promise<User> {
  const { data } = await request.get<ApiSuccess<User>>(ENDPOINTS.auth.me);
  return data.data;
}
