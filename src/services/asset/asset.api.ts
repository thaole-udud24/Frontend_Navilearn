import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { Asset, AssetFilters, UploadAssetInput } from './types';

export async function listAssets(filters: AssetFilters = {}): Promise<ApiSuccess<Asset[]>> {
  const { data } = await request.get<ApiSuccess<Asset[]>>(ENDPOINTS.assetItems.list, { params: filters });
  return data;
}

export async function uploadAsset(input: UploadAssetInput): Promise<Asset> {
  const form = new FormData();
  form.append('file', input.file);
  form.append('title', input.title);
  if (input.concept) form.append('concept', input.concept);
  if (input.description) form.append('description', input.description);
  const { data } = await request.post<ApiSuccess<Asset>>(ENDPOINTS.assetItems.create, form);
  return data.data;
}

export async function removeAsset(id: string): Promise<void> {
  await request.delete(ENDPOINTS.assetItems.detail(id));
}
