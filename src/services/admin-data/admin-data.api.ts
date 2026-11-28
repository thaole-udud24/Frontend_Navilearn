import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { DataActivityLogEntry, RetentionStats, StaleRecords, StudentDataExport } from './types';

export async function getRetentionStats(): Promise<RetentionStats> {
  const { data } = await request.get<ApiSuccess<RetentionStats>>(ENDPOINTS.adminData.retentionStats);
  return data.data;
}

export async function getStaleRecords(days = 30): Promise<StaleRecords> {
  const { data } = await request.get<ApiSuccess<StaleRecords>>(ENDPOINTS.adminData.staleRecords, {
    params: { days },
  });
  return data.data;
}

export async function exportStudentData(student: string): Promise<StudentDataExport> {
  const { data } = await request.get<ApiSuccess<StudentDataExport>>(ENDPOINTS.adminData.exportStudent, {
    params: { student },
  });
  return data.data;
}

export async function getDataActivityLog(limit = 20): Promise<DataActivityLogEntry[]> {
  const { data } = await request.get<ApiSuccess<DataActivityLogEntry[]>>(ENDPOINTS.adminData.activityLog, {
    params: { limit },
  });
  return data.data;
}
