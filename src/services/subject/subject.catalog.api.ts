import { request } from '@/utils/request';
import { downloadFile } from '@/utils/download';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import { buildDocumentForm } from './subject.api';
import type {
  CatalogFilters,
  DocumentMetaInput,
  ImportManifestRow,
  ImportReport,
  SharedDocumentFilters,
  Subject,
  SubjectDocument,
  SubjectInput,
} from './types';

// ---- shared subject catalog (read: both roles, write: ADMIN) ----
export async function listCatalog(filters: CatalogFilters): Promise<ApiSuccess<Subject[]>> {
  const { data } = await request.get<ApiSuccess<Subject[]>>(ENDPOINTS.subjectCatalog.list, { params: filters });
  return data;
}

export async function createCatalogSubject(input: SubjectInput): Promise<Subject> {
  const { data } = await request.post<ApiSuccess<Subject>>(ENDPOINTS.subjectCatalog.list, input);
  return data.data;
}

export async function updateCatalogSubject(id: string, input: Partial<SubjectInput>): Promise<Subject> {
  const { data } = await request.patch<ApiSuccess<Subject>>(ENDPOINTS.subjectCatalog.detail(id), input);
  return data.data;
}

export async function deactivateCatalogSubject(id: string): Promise<Subject> {
  const { data } = await request.post<ApiSuccess<Subject>>(ENDPOINTS.subjectCatalog.deactivate(id));
  return data.data;
}

export async function restoreCatalogSubject(id: string): Promise<Subject> {
  const { data } = await request.post<ApiSuccess<Subject>>(ENDPOINTS.subjectCatalog.restore(id));
  return data.data;
}

export function exportCatalog(): Promise<void> {
  return downloadFile(ENDPOINTS.subjectCatalog.export, 'subject-catalog.csv');
}

// ---- shared document library ----
export async function listSharedDocuments(
  filters: SharedDocumentFilters,
): Promise<ApiSuccess<SubjectDocument[]>> {
  const { data } = await request.get<ApiSuccess<SubjectDocument[]>>(ENDPOINTS.sharedDocuments.list, {
    params: filters,
  });
  return data;
}

export async function uploadSharedDocument(
  subjectId: string,
  file: File,
  meta: DocumentMetaInput,
): Promise<SubjectDocument> {
  const { data } = await request.post<ApiSuccess<SubjectDocument>>(
    ENDPOINTS.sharedDocuments.list,
    buildDocumentForm(file, meta, { subjectId }),
  );
  return data.data;
}

export async function updateSharedDocument(id: string, meta: DocumentMetaInput): Promise<SubjectDocument> {
  const { data } = await request.patch<ApiSuccess<SubjectDocument>>(ENDPOINTS.sharedDocuments.detail(id), meta);
  return data.data;
}

export async function removeSharedDocument(id: string): Promise<void> {
  await request.delete(ENDPOINTS.sharedDocuments.detail(id));
}

export function downloadSharedDocument(doc: SubjectDocument): Promise<void> {
  return downloadFile(ENDPOINTS.sharedDocuments.download(doc.id), doc.file.originalName);
}

export async function importSharedDocuments(
  files: File[],
  subjectId: string,
  manifest: ImportManifestRow[],
): Promise<ImportReport> {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  form.append('subjectId', subjectId);
  if (manifest.length > 0) form.append('manifest', JSON.stringify(manifest));
  const { data } = await request.post<ApiSuccess<ImportReport>>(ENDPOINTS.sharedDocuments.import, form);
  return data.data;
}
