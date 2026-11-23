import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { NextBestAction, ReplanCheckResult, ReplanResult, StartNextBestActionResult } from './types';

// AP-ADP-01: gợi ý hành động tiếp theo nên làm, kèm lý do (BR-12/BR-40). null nếu chưa có dữ liệu.
export async function getNextBestAction(): Promise<NextBestAction | null> {
  const { data } = await request.get<ApiSuccess<NextBestAction | null>>(
    ENDPOINTS.adaptiveItems.nextBestAction,
  );
  return data.data;
}

// UC-ADP-02: bắt đầu thực hiện gợi ý hiện tại.
export async function startNextBestAction(): Promise<StartNextBestActionResult> {
  const { data } = await request.post<ApiSuccess<StartNextBestActionResult>>(
    ENDPOINTS.adaptiveItems.startNextBestAction,
  );
  return data.data;
}

// AP-ADP-02: kiểm tra một kế hoạch có cần xếp lại không (có phiên bị bỏ lỡ).
export async function checkReplan(planId: string): Promise<ReplanCheckResult> {
  const { data } = await request.get<ApiSuccess<ReplanCheckResult>>(
    ENDPOINTS.adaptiveItems.replanCheck(planId),
  );
  return data.data;
}

// AP-ADP-03: đề xuất kế hoạch mới, sắp lại các phiên chưa học theo mức ưu tiên.
export async function replan(planId: string): Promise<ReplanResult> {
  const { data } = await request.post<ApiSuccess<ReplanResult>>(ENDPOINTS.adaptiveItems.replan, { planId });
  return data.data;
}
