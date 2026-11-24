import type { RecordSource } from '@/types/api.d';

export type LessonStatus = 'draft' | 'published' | 'archived';

export interface Lesson {
  _id: string;
  title: string;
  concept: { _id: string; name: string } | string;
  objectives: string[];
  theoryContent?: string;
  questions: string[];
  estimatedMinutes: number;
  status: LessonStatus;
  source?: RecordSource;
  createdAt: string;
  updatedAt: string;
}

export interface LessonFilters {
  page?: number;
  limit?: number;
  concept?: string;
  status?: LessonStatus;
}

export interface CreateLessonInput {
  title: string;
  concept: string;
  objectives?: string[];
  theoryContent?: string;
  questions?: string[];
  estimatedMinutes?: number;
  source?: RecordSource;
}

export type UpdateLessonInput = Partial<CreateLessonInput>;
