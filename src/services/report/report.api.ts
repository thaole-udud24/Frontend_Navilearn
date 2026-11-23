import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateReportItemInput, ReportItem, ReportItemFilters, ReportItemStatus } from './types';

export async function listReportItems(filters: ReportItemFilters): Promise<ApiSuccess<ReportItem[]>> {
  const { data } = await request.get<ApiSuccess<ReportItem[]>>(ENDPOINTS.reportItems.list, {
    params: filters,
  });
  return data;
}

export async function createReportItem(input: CreateReportItemInput): Promise<ReportItem> {
  const { data } = await request.post<ApiSuccess<ReportItem>>(ENDPOINTS.reportItems.create, input);
  return data.data;
}

export async function updateReportItemStatus(id: string, status: ReportItemStatus): Promise<ReportItem> {
  const { data } = await request.patch<ApiSuccess<ReportItem>>(ENDPOINTS.reportItems.updateStatus(id), {
    status,
  });
  return data.data;
}
