export type AiAssistItemStatus = 'open' | 'in_progress' | 'resolved';

export interface AiAssistItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: AiAssistItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AiAssistItemFilters {
  page?: number;
  limit?: number;
  status?: AiAssistItemStatus;
}

export interface CreateAiAssistItemInput {
  title: string;
  content: string;
}
