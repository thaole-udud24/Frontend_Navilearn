export type MasteryItemStatus = 'open' | 'in_progress' | 'resolved';
export type MasteryLevel = 'novice' | 'developing' | 'proficient' | 'mastered';

export interface MasteryItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: MasteryItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Mastery {
  _id: string;
  concept: { _id: string; name: string } | string;
  score: number;
  level: MasteryLevel;
  attemptsCount: number;
  correctCount: number;
  goalScore?: number;
  lastAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasteryItemFilters {
  page?: number;
  limit?: number;
  status?: MasteryItemStatus;
}

export interface MasteryFilters {
  page?: number;
  limit?: number;
  concept?: string;
  level?: MasteryLevel;
}

export interface CreateMasteryItemInput {
  title: string;
  content: string;
}

export interface MasteryTrendPoint {
  score: number;
  level: MasteryLevel;
  reason: string;
  at?: string;
}

export interface MasteryReportEntry {
  concept: { _id: string; name: string } | string;
  score: number;
  level: MasteryLevel;
  attemptsCount: number;
  goalScore?: number;
  history: MasteryTrendPoint[];
}
