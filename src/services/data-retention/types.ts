export type DataRetentionItemStatus = 'open' | 'in_progress' | 'resolved';

export interface DataRetentionItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: DataRetentionItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DataRetentionItemFilters {
  page?: number;
  limit?: number;
  status?: DataRetentionItemStatus;
}

export interface CreateDataRetentionItemInput {
  title: string;
  content: string;
}
