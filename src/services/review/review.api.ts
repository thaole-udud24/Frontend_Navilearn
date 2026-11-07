import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateReviewItemInput, ReviewItem, ReviewItemFilters } from './types';

export async function listReviewItems(filters: ReviewItemFilters): Promise<ApiSuccess<ReviewItem[]>> {
  const { data } = await request.get<ApiSuccess<ReviewItem[]>>(ENDPOINTS.reviewItems.list, { params: filters });
  return data;
}

export async function createReviewItem(input: CreateReviewItemInput): Promise<ReviewItem> {
  const { data } = await request.post<ApiSuccess<ReviewItem>>(ENDPOINTS.reviewItems.create, input);
  return data.data;
}
