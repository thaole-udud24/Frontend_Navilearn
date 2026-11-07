export type SupportItemStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: SupportItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupportItemFilters {
  page?: number;
  limit?: number;
  status?: SupportItemStatus;
}

export interface CreateSupportItemInput {
  title: string;
  content: string;
}
