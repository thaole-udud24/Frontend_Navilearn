import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  CreateNotificationBroadcastInput,
  CreateNotificationItemInput,
  NotificationBroadcast,
  NotificationBroadcastFilters,
  NotificationBroadcastResult,
  NotificationItem,
  NotificationItemFilters,
  NotificationItemStatus,
} from './types';

export async function listNotificationItems(
  filters: NotificationItemFilters,
): Promise<ApiSuccess<NotificationItem[]>> {
  const { data } = await request.get<ApiSuccess<NotificationItem[]>>(ENDPOINTS.notificationItems.list, {
    params: filters,
  });
  return data;
}

export async function createNotificationItem(input: CreateNotificationItemInput): Promise<NotificationItem> {
  const { data } = await request.post<ApiSuccess<NotificationItem>>(
    ENDPOINTS.notificationItems.create,
    input,
  );
  return data.data;
}

export async function updateNotificationItemStatus(
  id: string,
  status: NotificationItemStatus,
): Promise<NotificationItem> {
  const { data } = await request.patch<ApiSuccess<NotificationItem>>(
    ENDPOINTS.notificationItems.updateStatus(id),
    { status },
  );
  return data.data;
}

// N13: student marks one notification read (e.g. on click, before navigating to its link).
export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const { data } = await request.patch<ApiSuccess<NotificationItem>>(ENDPOINTS.notificationItems.markRead(id));
  return data.data;
}

// N13 "Đánh dấu đã đọc tất cả".
export async function markAllNotificationsRead(): Promise<void> {
  await request.patch(ENDPOINTS.notificationItems.readAll);
}

// B9: admin compose — real fan-out, one NotificationItem per targeted student.
export async function createNotificationBroadcast(
  input: CreateNotificationBroadcastInput,
): Promise<NotificationBroadcastResult> {
  const { data } = await request.post<ApiSuccess<NotificationBroadcastResult>>(
    ENDPOINTS.notificationItems.broadcast,
    input,
  );
  return data.data;
}

// B9: "Đã gửi" history.
export async function listNotificationBroadcasts(
  filters: NotificationBroadcastFilters,
): Promise<ApiSuccess<NotificationBroadcast[]>> {
  const { data } = await request.get<ApiSuccess<NotificationBroadcast[]>>(
    ENDPOINTS.notificationItems.broadcasts,
    { params: filters },
  );
  return data;
}
