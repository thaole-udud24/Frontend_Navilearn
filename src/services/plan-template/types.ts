import type { RecordSource } from '@/types/api.d';

export interface PlanTemplateStep {
  dayOffset: number;
  durationMin: number;
  note?: string;
  /** Short reading material the student sees before the attached quiz (UC-PLN-TPL-03). */
  theoryContent?: string;
  /** Question ids from the question bank — answering them is required before the session can be done. */
  questions?: string[];
}

export interface PlanTemplate {
  _id: string;
  title: string;
  description?: string;
  concept: { _id: string; name: string } | string | null;
  steps: PlanTemplateStep[];
  isActive: boolean;
  source?: RecordSource;
  createdAt: string;
  updatedAt: string;
}

export interface PlanTemplateFilters {
  page?: number;
  limit?: number;
}

export interface CreatePlanTemplateInput {
  title: string;
  description?: string;
  concept?: string;
  steps: PlanTemplateStep[];
  isActive?: boolean;
  source?: RecordSource;
}

export type UpdatePlanTemplateInput = Partial<CreatePlanTemplateInput>;

export interface ImportRowResult {
  createdCount: number;
  createdIds: string[];
  errorCount: number;
  errors: { row: number; message: string }[];
}
