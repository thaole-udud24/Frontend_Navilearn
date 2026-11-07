export type SubjectItemStatus = 'open' | 'in_progress' | 'resolved';

export interface SubjectItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: SubjectItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectItemFilters {
  page?: number;
  limit?: number;
  status?: SubjectItemStatus;
}

export interface CreateSubjectItemInput {
  title: string;
  content: string;
}
