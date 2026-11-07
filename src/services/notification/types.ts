export type NotificationItemStatus = 'open' | 'in_progress' | 'resolved';

export interface NotificationItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: NotificationItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItemFilters {
  page?: number;
  limit?: number;
  status?: NotificationItemStatus;
}

export interface CreateNotificationItemInput {
  title: string;
  content: string;
}
