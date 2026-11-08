export type AssessmentConfigStatus = 'active' | 'archived';

export interface AssessmentConfig {
  _id: string;
  title: string;
  concept: string;
  questions: string[];
  passScore: number;
  timeLimitMinutes: number;
  status: AssessmentConfigStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentConfigFilters {
  page?: number;
  limit?: number;
  concept?: string;
  status?: AssessmentConfigStatus;
}

export interface CreateAssessmentConfigInput {
  title: string;
  concept: string;
  questions: string[];
  passScore?: number;
  timeLimitMinutes?: number;
}
