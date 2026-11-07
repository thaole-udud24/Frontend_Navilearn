export type ReportItemStatus = 'open' | 'in_progress' | 'resolved';

export interface ReportItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: ReportItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReportItemFilters {
  page?: number;
  limit?: number;
  status?: ReportItemStatus;
}

export interface CreateReportItemInput {
  title: string;
  content: string;
}
