export type AssessmentConfigItemStatus = 'open' | 'in_progress' | 'resolved';

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
