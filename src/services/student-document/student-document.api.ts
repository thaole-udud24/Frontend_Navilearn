import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  StudentDocument,
  StudentDocumentFilters,
  UpdateStudentDocumentInput,
  UploadStudentDocumentInput,
} from './types';

export async function listStudentDocuments(
  filters: StudentDocumentFilters = {},
): Promise<ApiSuccess<StudentDocument[]>> {
  const { data } = await request.get<ApiSuccess<StudentDocument[]>>(ENDPOINTS.studentDocuments.list, {
    params: filters,
  });
  return data;
}

export async function uploadStudentDocument(input: UploadStudentDocumentInput): Promise<StudentDocument> {
  const form = new FormData();
  form.append('file', input.file);
  form.append('title', input.title);
  if (input.documentRole) form.append('documentRole', input.documentRole);
  if (input.description) form.append('description', input.description);
  if (input.tags?.length) form.append('tags', input.tags.join(','));
  if (input.concept) form.append('concept', input.concept);
  const { data } = await request.post<ApiSuccess<StudentDocument>>(ENDPOINTS.studentDocuments.create, form);
  return data.data;
}

export async function updateStudentDocument(
  id: string,
  input: UpdateStudentDocumentInput,
): Promise<StudentDocument> {
  const { data } = await request.patch<ApiSuccess<StudentDocument>>(ENDPOINTS.studentDocuments.update(id), input);
  return data.data;
}

export async function removeStudentDocument(id: string): Promise<void> {
  await request.delete(ENDPOINTS.studentDocuments.detail(id));
}

export async function analyzeStudentDocument(id: string): Promise<StudentDocument> {
  const { data } = await request.post<ApiSuccess<StudentDocument>>(ENDPOINTS.studentDocuments.analyze(id));
  return data.data;
}
