import { useQuery } from '@tanstack/react-query';
import { listNotificationItems } from '@/services/notification';
import { notificationItemKeys } from '@/services/notification/queryKeys';
import type { NotificationItemFilters } from '@/services/notification/types';

export function useAdminNotificationItemList(filters: NotificationItemFilters) {
  return useQuery({
    queryKey: notificationItemKeys.list(filters),
    queryFn: () => listNotificationItems(filters),
  });
}
