import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  CreateAdminReportItemInput,
  AdminReportItem,
  AdminReportItemFilters,
  AdminReportItemStatus,
} from './types';

export async function listAdminReportItems(
  filters: AdminReportItemFilters,
): Promise<ApiSuccess<AdminReportItem[]>> {
  const { data } = await request.get<ApiSuccess<AdminReportItem[]>>(ENDPOINTS.adminReportItems.list, {
    params: filters,
  });
  return data;
}

// N11: sent as FormData only when there's an attachment to carry (same optional-multipart pattern
// as the backend route — plain JSON still works for reports with no screenshot).
export async function createAdminReportItem(input: CreateAdminReportItemInput): Promise<AdminReportItem> {
  if (input.attachment) {
    const form = new FormData();
    form.append('title', input.title);
    form.append('content', input.content);
    if (input.issueType) form.append('issueType', input.issueType);
    if (input.location) form.append('location', input.location);
    form.append('attachment', input.attachment);
    const { data } = await request.post<ApiSuccess<AdminReportItem>>(ENDPOINTS.adminReportItems.create, form);
    return data.data;
  }
  const { data } = await request.post<ApiSuccess<AdminReportItem>>(ENDPOINTS.adminReportItems.create, {
    title: input.title,
    content: input.content,
    issueType: input.issueType,
    location: input.location,
  });
  return data.data;
}

export async function updateAdminReportItemStatus(
  id: string,
  status: AdminReportItemStatus,
): Promise<AdminReportItem> {
  const { data } = await request.patch<ApiSuccess<AdminReportItem>>(
    ENDPOINTS.adminReportItems.updateStatus(id),
    {
      status,
    },
  );
  return data.data;
}

// B10: admin reply, shown back to the reporting student.
export async function respondAdminReportItem(id: string, message: string): Promise<AdminReportItem> {
  const { data } = await request.patch<ApiSuccess<AdminReportItem>>(ENDPOINTS.adminReportItems.respond(id), {
    message,
  });
  return data.data;
}
