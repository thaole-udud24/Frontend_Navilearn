import type { User } from './account.auth.types';

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface Profile extends User {
  emailVerified: boolean;
  locale: 'vi' | 'en';
  timezone: string;
  learningGoal: string;
  /** Available study minutes per weekday (BR-56). */
  availability: Record<Weekday, number>;
  createdAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  locale?: 'vi' | 'en';
  timezone?: string;
  learningGoal?: string;
  availability?: Partial<Record<Weekday, number>>;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface LoginSession {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}
