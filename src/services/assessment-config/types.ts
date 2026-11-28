import type { RecordSource } from '@/types/api.d';

export type AssessmentConfigItemStatus = 'open' | 'in_progress' | 'resolved';
export type AssessmentConfigStatus = 'active' | 'archived';
export type AssessmentConfigKind =
  | 'placement'
  | 'practice'
  | 'chapter_test'
  | 'mock_exam'
  | 'independent_check';
export type ShowAnswersPolicy = 'after_submit' | 'after_due' | 'never';

export interface RetryPolicy {
  maxAttempts?: number;
  cooldownMinutes?: number;
}

export interface AssessmentConfigItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: AssessmentConfigItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentConfigItemFilters {
  page?: number;
  limit?: number;
  status?: AssessmentConfigItemStatus;
}

export interface CreateAssessmentConfigItemInput {
  title: string;
  content: string;
}

export interface AssessmentConfig {
  _id: string;
  owner: string;
  title: string;
  concept: string;
  questions: string[];
  passScore: number;
  timeLimitMinutes: number;
  kind: AssessmentConfigKind;
  retryPolicy?: RetryPolicy;
  showAnswersPolicy?: ShowAnswersPolicy;
  status: AssessmentConfigStatus;
  source?: RecordSource;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentConfigFilters {
  page?: number;
  limit?: number;
  concept?: string;
  subjectId?: string;
  kind?: AssessmentConfigKind;
  status?: AssessmentConfigStatus;
}

export interface CreateAssessmentConfigInput {
  title: string;
  concept: string;
  questions: string[];
  passScore?: number;
  timeLimitMinutes?: number;
  kind?: AssessmentConfigKind;
}

export type UpdateAssessmentConfigInput = Partial<CreateAssessmentConfigInput>;

export interface UpdatePolicyInput {
  retryPolicy?: RetryPolicy;
  showAnswersPolicy?: ShowAnswersPolicy;
}

export interface RubricCriterion {
  name: string;
  /** % of the rubric's totalPoints this criterion is worth; all criteria must sum to 100. */
  weightPct: number;
  description?: string;
}

export interface Rubric {
  _id: string;
  title: string;
  concept: string;
  /** The point scale weightPct applies to (e.g. 100 => a criterion with weightPct 30 is worth 30 points). */
  totalPoints: number;
  criteria: RubricCriterion[];
  status: AssessmentConfigStatus;
  source?: RecordSource;
  createdAt: string;
  updatedAt: string;
}

export interface RubricFilters {
  page?: number;
  limit?: number;
  concept?: string;
  status?: AssessmentConfigStatus;
}

export interface CreateRubricInput {
  title: string;
  concept: string;
  totalPoints: number;
  criteria: RubricCriterion[];
}

export type UpdateRubricInput = Partial<Pick<CreateRubricInput, 'title' | 'totalPoints' | 'criteria'>>;

export interface ImportRowResult {
  createdCount: number;
  createdIds: string[];
  errorCount: number;
  errors: { row: number; message: string }[];
}
