export type MonitoringItemStatus = 'open' | 'in_progress' | 'resolved';

export interface MonitoringItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: MonitoringItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringItemFilters {
  page?: number;
  limit?: number;
  status?: MonitoringItemStatus;
}

export interface CreateMonitoringItemInput {
  title: string;
  content: string;
}
