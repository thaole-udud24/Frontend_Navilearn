import { request } from '@/utils/request';
import { downloadFile } from '@/utils/download';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  DocumentFilters,
  DocumentMetaInput,
  Subject,
  SubjectDocument,
  SubjectFilters,
  SubjectInput,
} from './types';

/** Multipart body: the file plus the document fields as strings (the backend parses tags/booleans). */
export function buildDocumentForm(
  file: File | null,
  meta: DocumentMetaInput,
  extra: Record<string, string> = {},
): FormData {
  const form = new FormData();
  if (file) form.append('file', file);
  Object.entries(extra).forEach(([key, value]) => form.append(key, value));
  if (meta.name !== undefined) form.append('name', meta.name);
  if (meta.description !== undefined) form.append('description', meta.description);
  if (meta.tags !== undefined) form.append('tags', meta.tags.join(','));
  if (meta.important !== undefined) form.append('important', String(meta.important));
  if (meta.chapter !== undefined) form.append('chapter', meta.chapter);
  if (meta.topic !== undefined) form.append('topic', meta.topic);
  if (meta.concept !== undefined) form.append('concept', meta.concept);
  return form;
}

// ---- personal subjects (STUDENT) ----
export async function listSubjects(filters: SubjectFilters): Promise<ApiSuccess<Subject[]>> {
  const { data } = await request.get<ApiSuccess<Subject[]>>(ENDPOINTS.subjects.list, { params: filters });
  return data;
}

export async function getSubject(id: string): Promise<Subject> {
  const { data } = await request.get<ApiSuccess<Subject>>(ENDPOINTS.subjects.detail(id));
  return data.data;
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const { data } = await request.post<ApiSuccess<Subject>>(ENDPOINTS.subjects.list, input);
  return data.data;
}

export async function createSubjectFromCatalog(catalogSubjectId: string): Promise<Subject> {
  const { data } = await request.post<ApiSuccess<Subject>>(ENDPOINTS.subjects.fromCatalog, { catalogSubjectId });
  return data.data;
}

export async function updateSubject(id: string, input: Partial<SubjectInput>): Promise<Subject> {
  const { data } = await request.patch<ApiSuccess<Subject>>(ENDPOINTS.subjects.detail(id), input);
  return data.data;
}

export async function setSubjectPinned(id: string, pinned: boolean): Promise<Subject> {
  const { data } = await request.patch<ApiSuccess<Subject>>(ENDPOINTS.subjects.pin(id), { pinned });
  return data.data;
}

export async function reorderSubjects(ids: string[]): Promise<void> {
  await request.patch(ENDPOINTS.subjects.reorder, { ids });
}

export async function archiveSubject(id: string): Promise<Subject> {
  const { data } = await request.post<ApiSuccess<Subject>>(ENDPOINTS.subjects.archive(id));
  return data.data;
}

export async function restoreSubject(id: string): Promise<Subject> {
  const { data } = await request.post<ApiSuccess<Subject>>(ENDPOINTS.subjects.restore(id));
  return data.data;
}

export async function deleteSubject(id: string): Promise<void> {
  await request.delete(ENDPOINTS.subjects.detail(id));
}

// ---- personal documents (STUDENT) ----
export async function listDocuments(
  subjectId: string,
  filters: DocumentFilters,
): Promise<ApiSuccess<SubjectDocument[]>> {
  const { data } = await request.get<ApiSuccess<SubjectDocument[]>>(ENDPOINTS.subjects.documents(subjectId), {
    params: filters,
  });
  return data;
}

export async function listUploads(
  subjectId: string,
  filters: DocumentFilters,
): Promise<ApiSuccess<SubjectDocument[]>> {
  const { data } = await request.get<ApiSuccess<SubjectDocument[]>>(ENDPOINTS.subjects.uploads(subjectId), {
    params: filters,
  });
  return data;
}

export async function uploadDocument(
  subjectId: string,
  file: File,
  meta: DocumentMetaInput,
): Promise<SubjectDocument> {
  const { data } = await request.post<ApiSuccess<SubjectDocument>>(
    ENDPOINTS.subjects.documents(subjectId),
    buildDocumentForm(file, meta),
  );
  return data.data;
}

export async function updateDocument(
  subjectId: string,
  docId: string,
  meta: DocumentMetaInput,
): Promise<SubjectDocument> {
  const { data } = await request.patch<ApiSuccess<SubjectDocument>>(
    ENDPOINTS.subjects.document(subjectId, docId),
    meta,
  );
  return data.data;
}

export async function replaceDocumentFile(subjectId: string, docId: string, file: File): Promise<SubjectDocument> {
  const { data } = await request.put<ApiSuccess<SubjectDocument>>(
    ENDPOINTS.subjects.documentFile(subjectId, docId),
    buildDocumentForm(file, {}),
  );
  return data.data;
}

export async function deleteDocument(subjectId: string, docId: string): Promise<void> {
  await request.delete(ENDPOINTS.subjects.document(subjectId, docId));
}

export function downloadDocument(subjectId: string, doc: SubjectDocument): Promise<void> {
  return downloadFile(ENDPOINTS.subjects.documentDownload(subjectId, doc.id), doc.file.originalName);
}
