import type { NotificationItemFilters } from '@/services/notification/types';

export const notificationItemKeys = {
  all: ['notificationItems'] as const,
  list: (filters: NotificationItemFilters) => [...notificationItemKeys.all, 'list', filters] as const,
  detail: (id: string) => [...notificationItemKeys.all, 'detail', id] as const,
};
