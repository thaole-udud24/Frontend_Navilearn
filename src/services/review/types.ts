export type ReviewItemStatus = 'open' | 'in_progress' | 'resolved';

export interface ReviewItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: ReviewItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewItemFilters {
  page?: number;
  limit?: number;
  status?: ReviewItemStatus;
}

export interface CreateReviewItemInput {
  title: string;
  content: string;
}
