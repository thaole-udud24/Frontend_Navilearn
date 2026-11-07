export type AdminReportItemStatus = 'open' | 'in_progress' | 'resolved';

export interface AdminReportItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: AdminReportItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReportItemFilters {
  page?: number;
  limit?: number;
  status?: AdminReportItemStatus;
}

export interface CreateAdminReportItemInput {
  title: string;
  content: string;
}
