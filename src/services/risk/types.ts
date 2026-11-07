export type RiskItemStatus = 'open' | 'in_progress' | 'resolved';

export interface RiskItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: RiskItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RiskItemFilters {
  page?: number;
  limit?: number;
  status?: RiskItemStatus;
}

export interface CreateRiskItemInput {
  title: string;
  content: string;
}
