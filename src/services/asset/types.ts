export interface Asset {
  _id: string;
  title: string;
  concept: { _id: string; name: string } | string | null;
  assetType: 'document';
  fileUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  description?: string;
  status: 'active' | 'removed';
  createdAt: string;
  updatedAt: string;
}

export interface AssetFilters {
  page?: number;
  limit?: number;
  concept?: string;
}

export interface UploadAssetInput {
  file: File;
  title: string;
  concept?: string;
  description?: string;
}
