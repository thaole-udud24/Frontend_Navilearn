export type PlanningItemStatus = 'open' | 'in_progress' | 'resolved';

export interface PlanningItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: PlanningItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningItemFilters {
  page?: number;
  limit?: number;
  status?: PlanningItemStatus;
}

export interface CreatePlanningItemInput {
  title: string;
  content: string;
}
