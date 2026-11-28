import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { DismissRiskWarningInput, RiskWarning } from './types';

// N9: danh sách cảnh báo rủi ro hệ thống tự sinh cho sinh viên hiện tại (BR-12/BR-13).
export async function listRiskWarnings(): Promise<RiskWarning[]> {
  const { data } = await request.get<ApiSuccess<RiskWarning[]>>(ENDPOINTS.riskItems.warnings);
  return data.data;
}

// "Giữ nguyên" hoặc "Nhắc tôi sau" cho một cảnh báo.
export async function dismissRiskWarning(input: DismissRiskWarningInput): Promise<void> {
  await request.post(ENDPOINTS.riskItems.dismiss, input);
}
