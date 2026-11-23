import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  CreateMonitoringItemInput,
  MonitoringItem,
  MonitoringItemFilters,
  MonitoringItemStatus,
} from './types';

export async function listMonitoringItems(
  filters: MonitoringItemFilters,
): Promise<ApiSuccess<MonitoringItem[]>> {
  const { data } = await request.get<ApiSuccess<MonitoringItem[]>>(ENDPOINTS.monitoringItems.list, {
    params: filters,
  });
  return data;
}

export async function createMonitoringItem(input: CreateMonitoringItemInput): Promise<MonitoringItem> {
  const { data } = await request.post<ApiSuccess<MonitoringItem>>(ENDPOINTS.monitoringItems.create, input);
  return data.data;
}

export async function updateMonitoringItemStatus(
  id: string,
  status: MonitoringItemStatus,
): Promise<MonitoringItem> {
  const { data } = await request.patch<ApiSuccess<MonitoringItem>>(
    ENDPOINTS.monitoringItems.updateStatus(id),
    { status },
  );
  return data.data;
}
