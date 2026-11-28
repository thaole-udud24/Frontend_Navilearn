import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  BadgesResponse,
  ChangePasswordInput,
  LoginSession,
  Profile,
  StudyStreak,
  UpdateProfileInput,
} from './account.profile.types';

export async function getProfile(): Promise<Profile> {
  const { data } = await request.get<ApiSuccess<Profile>>(ENDPOINTS.me.profile);
  return data.data;
}

export async function getStreak(): Promise<StudyStreak> {
  const { data } = await request.get<ApiSuccess<StudyStreak>>(ENDPOINTS.me.streak);
  return data.data;
}

export async function getBadges(): Promise<BadgesResponse> {
  const { data } = await request.get<ApiSuccess<BadgesResponse>>(ENDPOINTS.me.badges);
  return data.data;
}

export async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  const { data } = await request.patch<ApiSuccess<Profile>>(ENDPOINTS.me.profile, input);
  return data.data;
}

export async function uploadAvatar(file: File): Promise<Profile> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await request.post<ApiSuccess<Profile>>(ENDPOINTS.me.avatar, form);
  return data.data;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await request.post(ENDPOINTS.me.changePassword, input);
}

export async function listSessions(): Promise<LoginSession[]> {
  const { data } = await request.get<ApiSuccess<LoginSession[]>>(ENDPOINTS.me.sessions);
  return data.data;
}

export async function revokeSession(id: string): Promise<void> {
  await request.delete(ENDPOINTS.me.session(id));
}

export async function revokeOtherSessions(): Promise<void> {
  await request.delete(ENDPOINTS.me.sessions);
}

export async function deleteMyAccount(password: string): Promise<void> {
  await request.delete(ENDPOINTS.me.deleteAccount, { data: { password } });
}
