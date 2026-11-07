export type KnowledgeItemStatus = 'open' | 'in_progress' | 'resolved';

export interface KnowledgeItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: KnowledgeItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeItemFilters {
  page?: number;
  limit?: number;
  status?: KnowledgeItemStatus;
}

export interface CreateKnowledgeItemInput {
  title: string;
  content: string;
}
