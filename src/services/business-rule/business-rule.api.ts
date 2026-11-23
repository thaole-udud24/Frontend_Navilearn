import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  BusinessRule,
  BusinessRuleFilters,
  CreateBusinessRuleInput,
  UpdateBusinessRuleInput,
  ResetBusinessRuleInput,
  RuleHistoryEntry,
} from './types';

// Lấy danh sách quy tắc
export async function listBusinessRules(
  filters: BusinessRuleFilters = {},
): Promise<ApiSuccess<BusinessRule[]>> {
  const { data } = await request.get<ApiSuccess<BusinessRule[]>>(ENDPOINTS.businessRuleItems.list, {
    params: filters,
  });
  return data;
}

// Lấy chi tiết quy tắc theo ID
export async function getBusinessRuleDetail(id: string): Promise<ApiSuccess<BusinessRule>> {
  const { data } = await request.get<ApiSuccess<BusinessRule>>(ENDPOINTS.businessRuleItems.detail(id));
  return data;
}

// Cập nhật quy tắc
export async function updateBusinessRule(id: string, input: UpdateBusinessRuleInput): Promise<BusinessRule> {
  const { data } = await request.patch<ApiSuccess<BusinessRule>>(
    ENDPOINTS.businessRuleItems.update(id),
    input,
  );
  return data.data;
}

// Reset quy tắc về giá trị mặc định
export async function resetBusinessRule(
  id: string,
  input: ResetBusinessRuleInput = {},
): Promise<BusinessRule> {
  const { data } = await request.post<ApiSuccess<BusinessRule>>(ENDPOINTS.businessRuleItems.reset(id), input);
  return data.data;
}

// Xem lịch sử thay đổi của quy tắc
export async function getBusinessRuleHistory(id: string): Promise<RuleHistoryEntry[]> {
  const { data } = await request.get<ApiSuccess<RuleHistoryEntry[]>>(ENDPOINTS.businessRuleItems.history(id));
  return data.data;
}

// Tạo quy tắc mới
export async function createBusinessRule(input: CreateBusinessRuleInput): Promise<BusinessRule> {
  const { data } = await request.post<ApiSuccess<BusinessRule>>(ENDPOINTS.businessRuleItems.create, input);
  return data.data;
}

// Xóa (mềm) quy tắc
export async function removeBusinessRule(id: string): Promise<void> {
  await request.delete(ENDPOINTS.businessRuleItems.remove(id));
}

// Xuất CSV đầy đủ (do backend sinh, không phải JSON lấy từ trang hiện tại)
export async function exportBusinessRules(): Promise<Blob> {
  const { data } = await request.get<Blob>(ENDPOINTS.businessRuleItems.export, { responseType: 'blob' });
  return data;
}

export const listBusinessRuleItems = listBusinessRules;
export const createBusinessRuleItem = createBusinessRule;
