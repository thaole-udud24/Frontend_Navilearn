export type NotificationItemStatus = 'open' | 'in_progress' | 'resolved';
export type NotificationCategory = 'hoc_tap' | 'he_thong';

export interface NotificationItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: NotificationItemStatus;
  /** N13: per-student read-tracking/category — separate from `status` above (admin workflow field). */
  category: NotificationCategory;
  read: boolean;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItemFilters {
  page?: number;
  limit?: number;
  status?: NotificationItemStatus;
  category?: NotificationCategory;
  read?: boolean;
}

export interface CreateNotificationItemInput {
  title: string;
  content: string;
}

// B9: admin compose — real fan-out to a targeted set of students.
export type NotificationAudience = { type: 'all' } | { type: 'subject'; subjectId: string };

export interface CreateNotificationBroadcastInput {
  audience: NotificationAudience;
  category: NotificationCategory;
  title: string;
  content: string;
  link?: string;
}

export interface NotificationBroadcastResult {
  broadcastId: string;
  audienceLabel: string;
  category: NotificationCategory;
  title: string;
  recipientCount: number;
}

/** One row of "Đã gửi" history — one broadcast, grouped back from its per-student NotificationItems. */
export interface NotificationBroadcast {
  broadcastId: string;
  title: string;
  category: NotificationCategory;
  audienceLabel: string;
  createdAt: string;
  total: number;
  readCount: number;
}

export interface NotificationBroadcastFilters {
  page?: number;
  limit?: number;
}
