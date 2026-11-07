export type TemplateItemStatus = 'open' | 'in_progress' | 'resolved';

export interface TemplateItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: TemplateItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateItemFilters {
  page?: number;
  limit?: number;
  status?: TemplateItemStatus;
}

export interface CreateTemplateItemInput {
  title: string;
  content: string;
}
