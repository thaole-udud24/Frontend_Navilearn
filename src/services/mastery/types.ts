export type MasteryLevel = 'novice' | 'developing' | 'proficient' | 'mastered';

export interface Mastery {
  _id: string;
  concept: { _id: string; name: string } | string;
  score: number;
  level: MasteryLevel;
  attemptsCount: number;
  correctCount: number;
  lastAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasteryFilters {
  page?: number;
  limit?: number;
  concept?: string;
}
