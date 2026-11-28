// Same role enum as a student's own documents (business doc 3.2 "document_role") — reused, not
// redefined, from the student-document service's types.
import type { DocumentRole } from '@/services/student-document/types';
export { DOCUMENT_ROLES } from '@/services/student-document/types';
export type { DocumentRole };

export type ProcessingStatus = 'pending' | 'processed' | 'error';

export interface Asset {
  _id: string;
  title: string;
  concept: { _id: string; name: string } | string | null;
  assetType: 'document';
  documentRole: DocumentRole;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  description?: string;
  tags: string[];
  important: boolean;
  /** "Xuất bản cho SV" — only assets with studentVisible: true show up in the student library. */
  studentVisible: boolean;
  processingStatus: ProcessingStatus;
  status: 'active' | 'removed';
  createdAt: string;
  updatedAt: string;
}

export interface AssetFilters {
  page?: number;
  limit?: number;
  concept?: string;
  subjectId?: string;
}

export interface UploadAssetInput {
  file: File;
  title: string;
  concept?: string;
  documentRole?: DocumentRole;
  description?: string;
  tags?: string[];
  important?: boolean;
  studentVisible?: boolean;
}

export interface UpdateAssetInput {
  title?: string;
  concept?: string;
  documentRole?: DocumentRole;
  description?: string;
  tags?: string[];
  important?: boolean;
  studentVisible?: boolean;
}

export interface ImportManifestRow {
  file: string;
  title?: string;
  description?: string;
  concept?: string;
  tags?: string[];
  important?: boolean;
}

export interface ImportReport {
  createdCount: number;
  createdIds: string[];
  errorCount: number;
  errors: { row: number; message: string; file: string }[];
}
