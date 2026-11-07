export type BusinessRuleItemStatus = 'open' | 'in_progress' | 'resolved';

export interface BusinessRuleItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: BusinessRuleItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessRuleItemFilters {
  page?: number;
  limit?: number;
  status?: BusinessRuleItemStatus;
}

export interface CreateBusinessRuleItemInput {
  title: string;
  content: string;
}
