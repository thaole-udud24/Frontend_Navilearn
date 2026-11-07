import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateNotificationItemInput, NotificationItem, NotificationItemFilters } from './types';

export async function listNotificationItems(filters: NotificationItemFilters): Promise<ApiSuccess<NotificationItem[]>> {
  const { data } = await request.get<ApiSuccess<NotificationItem[]>>(ENDPOINTS.notificationItems.list, { params: filters });
  return data;
}

export async function createNotificationItem(input: CreateNotificationItemInput): Promise<NotificationItem> {
  const { data } = await request.post<ApiSuccess<NotificationItem>>(ENDPOINTS.notificationItems.create, input);
  return data.data;
}
