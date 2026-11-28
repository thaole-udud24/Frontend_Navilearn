import type { RecordSource } from '@/types/api.d';

export interface PlanTemplateStep {
  dayOffset: number;
  durationMin: number;
  /** Stage name, shown everywhere this step appears (builder, preview, student roadmap). */
  title: string;
  /** Groups this step under a chapter header in the student roadmap — display only. */
  chapterTitle?: string;
  /** Short optional description — separate from `title`. */
  note?: string;
  /** "Sau buổi này bạn có thể…" — carried into the student's session on apply. */
  objectives?: string[];
  /** Short reading material the student sees before the attached quiz (UC-PLN-TPL-03). */
  theoryContent?: string;
  /** Question ids from the question bank — answering them is required before the session can be done. */
  questions?: string[];
  /** Optional link to a Thư viện bài học lesson this step was authored from — when set, objectives/
   * theoryContent/questions above are a snapshot copied from that lesson (server-maintained); use
   * the sync-lesson endpoint to re-copy after the lesson is edited. */
  lessonId?: string | null;
}

export type PlanTemplateStatus = 'draft' | 'published' | 'archived';

export interface PlanTemplate {
  _id: string;
  title: string;
  description?: string;
  concept: { _id: string; name: string } | string | null;
  steps: PlanTemplateStep[];
  status: PlanTemplateStatus;
  version: number;
  publishedAt?: string | null;
  changeLog?: string;
  /** Display name of whoever created/last edited it — null when that user account no longer exists. */
  authorName?: string | null;
  source?: RecordSource;
  createdAt: string;
  updatedAt: string;
}

export interface PlanTemplateFilters {
  page?: number;
  limit?: number;
  status?: PlanTemplateStatus;
  concept?: string;
  subjectId?: string;
}

export interface CreatePlanTemplateInput {
  title: string;
  description?: string;
  concept?: string;
  steps: PlanTemplateStep[];
  source?: RecordSource;
}

export type UpdatePlanTemplateInput = Partial<CreatePlanTemplateInput>;

export interface ImportRowResult {
  createdCount: number;
  createdIds: string[];
  errorCount: number;
  errors: { row: number; message: string }[];
}
