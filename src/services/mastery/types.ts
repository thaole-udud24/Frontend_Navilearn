export type MasteryItemStatus = 'open' | 'in_progress' | 'resolved';

export interface MasteryItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: MasteryItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MasteryItemFilters {
  page?: number;
  limit?: number;
  status?: MasteryItemStatus;
}

export interface CreateMasteryItemInput {
  title: string;
  content: string;
}
