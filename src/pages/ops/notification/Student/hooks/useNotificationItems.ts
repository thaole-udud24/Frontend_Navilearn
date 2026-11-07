import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNotificationItem, listNotificationItems } from '@/services/notification';
import { notificationItemKeys } from '@/services/notification/queryKeys';
import type { CreateNotificationItemInput, NotificationItemFilters } from '@/services/notification/types';

export function useNotificationItemList(filters: NotificationItemFilters) {
  return useQuery({
    queryKey: notificationItemKeys.list(filters),
    queryFn: () => listNotificationItems(filters),
  });
}

export function useCreateNotificationItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNotificationItemInput) => createNotificationItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationItemKeys.all }),
  });
}
