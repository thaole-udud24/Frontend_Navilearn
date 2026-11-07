import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateAccountItemInput, AccountItem, AccountItemFilters } from './types';

export async function listAccountItems(filters: AccountItemFilters): Promise<ApiSuccess<AccountItem[]>> {
  const { data } = await request.get<ApiSuccess<AccountItem[]>>(ENDPOINTS.accountItems.list, { params: filters });
  return data;
}

export async function createAccountItem(input: CreateAccountItemInput): Promise<AccountItem> {
  const { data } = await request.post<ApiSuccess<AccountItem>>(ENDPOINTS.accountItems.create, input);
  return data.data;
}
