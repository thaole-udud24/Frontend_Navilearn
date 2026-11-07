export type RbacItemStatus = 'open' | 'in_progress' | 'resolved';

export interface RbacItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: RbacItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RbacItemFilters {
  page?: number;
  limit?: number;
  status?: RbacItemStatus;
}

export interface CreateRbacItemInput {
  title: string;
  content: string;
}
