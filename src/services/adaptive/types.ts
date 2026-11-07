export type AdaptiveItemStatus = 'open' | 'in_progress' | 'resolved';

export interface AdaptiveItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: AdaptiveItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdaptiveItemFilters {
  page?: number;
  limit?: number;
  status?: AdaptiveItemStatus;
}

export interface CreateAdaptiveItemInput {
  title: string;
  content: string;
}
