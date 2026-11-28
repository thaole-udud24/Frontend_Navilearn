import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { Asset, AssetFilters, ImportManifestRow, ImportReport, UpdateAssetInput, UploadAssetInput } from './types';

export async function listAssets(filters: AssetFilters = {}): Promise<ApiSuccess<Asset[]>> {
  const { data } = await request.get<ApiSuccess<Asset[]>>(ENDPOINTS.assetItems.list, { params: filters });
  return data;
}

export async function uploadAsset(input: UploadAssetInput): Promise<Asset> {
  const form = new FormData();
  form.append('file', input.file);
  form.append('title', input.title);
  if (input.concept) form.append('concept', input.concept);
  if (input.documentRole) form.append('documentRole', input.documentRole);
  if (input.description) form.append('description', input.description);
  if (input.tags?.length) form.append('tags', input.tags.join(','));
  if (input.important !== undefined) form.append('important', String(input.important));
  if (input.studentVisible !== undefined) form.append('studentVisible', String(input.studentVisible));
  const { data } = await request.post<ApiSuccess<Asset>>(ENDPOINTS.assetItems.create, form);
  return data.data;
}

export async function updateAsset(id: string, input: UpdateAssetInput): Promise<Asset> {
  const { data } = await request.patch<ApiSuccess<Asset>>(ENDPOINTS.assetItems.update(id), input);
  return data.data;
}

export async function removeAsset(id: string): Promise<void> {
  await request.delete(ENDPOINTS.assetItems.detail(id));
}

export async function importAssets(
  files: File[],
  concept: string | undefined,
  manifest: ImportManifestRow[],
): Promise<ImportReport> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  if (concept) form.append('concept', concept);
  if (manifest.length > 0) form.append('manifest', JSON.stringify(manifest));
  const { data } = await request.post<ApiSuccess<ImportReport>>(ENDPOINTS.assetItems.import, form);
  return data.data;
}
