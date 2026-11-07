export type AssessmentItemStatus = 'open' | 'in_progress' | 'resolved';

export interface AssessmentItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: AssessmentItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentItemFilters {
  page?: number;
  limit?: number;
  status?: AssessmentItemStatus;
}

export interface CreateAssessmentItemInput {
  title: string;
  content: string;
}
