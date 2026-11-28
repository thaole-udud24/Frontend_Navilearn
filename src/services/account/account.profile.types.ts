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
  /** N14 "Nhắc học" — student-level DEFAULTS only (0 = Sunday .. 6 = Saturday, same shape as
   * PlanningGoal.restDays); no reminder-sending mechanism reads these yet. */
  notificationHour: number;
  defaultRestDays: number[];
  createdAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  locale?: 'vi' | 'en';
  timezone?: string;
  learningGoal?: string;
  availability?: Partial<Record<Weekday, number>>;
  notificationHour?: number;
  defaultRestDays?: number[];
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface StudyStreak {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  activeToday: boolean;
}

export interface StreakBadge {
  code: string;
  name: string;
  thresholdDays: number;
  earnedAt?: string;
}

export interface BadgesResponse {
  earned: StreakBadge[];
  catalog: StreakBadge[];
}

export interface LoginSession {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}
