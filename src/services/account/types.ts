export type AccountItemStatus = 'open' | 'in_progress' | 'resolved';

export interface AccountItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: AccountItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AccountItemFilters {
  page?: number;
  limit?: number;
  status?: AccountItemStatus;
}

export interface CreateAccountItemInput {
  title: string;
  content: string;
}
