import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateAdminReportItemInput, AdminReportItem, AdminReportItemFilters } from './types';

export async function listAdminReportItems(filters: AdminReportItemFilters): Promise<ApiSuccess<AdminReportItem[]>> {
  const { data } = await request.get<ApiSuccess<AdminReportItem[]>>(ENDPOINTS.adminReportItems.list, { params: filters });
  return data;
}

export async function createAdminReportItem(input: CreateAdminReportItemInput): Promise<AdminReportItem> {
  const { data } = await request.post<ApiSuccess<AdminReportItem>>(ENDPOINTS.adminReportItems.create, input);
  return data.data;
}
