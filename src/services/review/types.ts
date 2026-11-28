export type ReviewItemStatus = 'open' | 'in_progress' | 'resolved';
// B11: "Về" — what the feedback is about.
export type ReviewCategory = 'lo_trinh' | 'luyen_tap' | 'noi_dung' | 'he_thong' | 'khac';

export interface ReviewOwnerRef {
  _id: string;
  email: string;
  fullName: string;
}

export interface ReviewItem {
  _id: string;
  /** Populated with {_id,email,fullName} on the admin list; a plain id string elsewhere. */
  owner: string | ReviewOwnerRef;
  title: string;
  content: string;
  status: ReviewItemStatus;
  rating: number;
  category: ReviewCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewItemFilters {
  page?: number;
  limit?: number;
  status?: ReviewItemStatus;
  category?: ReviewCategory;
  rating?: number;
}

export interface CreateReviewItemInput {
  title: string;
  content: string;
  rating: number;
  category: ReviewCategory;
}

// B11: real aggregate stats for the admin tiles.
export interface ReviewStats {
  avgRating: number;
  total: number;
  unseen: number;
  byCategory: { category: ReviewCategory; avgRating: number; total: number }[];
}
