export type AiConfigItemStatus = 'open' | 'in_progress' | 'resolved';

export interface AiConfigItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: AiConfigItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AiConfigItemFilters {
  page?: number;
  limit?: number;
  status?: AiConfigItemStatus;
}

export interface CreateAiConfigItemInput {
  title: string;
  content: string;
}
