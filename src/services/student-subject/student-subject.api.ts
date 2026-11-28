import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  CreateStudentSubjectInput,
  StudentSubject,
  StudentSubjectFilters,
  UpdateStudentSubjectInput,
} from './types';

export async function listStudentSubjects(
  filters: StudentSubjectFilters = {},
): Promise<ApiSuccess<StudentSubject[]>> {
  const { data } = await request.get<ApiSuccess<StudentSubject[]>>(ENDPOINTS.studentSubjectItems.list, {
    params: filters,
  });
  return data;
}

export async function listAllStudentSubjects(): Promise<StudentSubject[]> {
  const { data } = await request.get<ApiSuccess<StudentSubject[]>>(ENDPOINTS.studentSubjectItems.all);
  return data.data;
}

export async function addStudentSubject(input: CreateStudentSubjectInput): Promise<StudentSubject> {
  const { data } = await request.post<ApiSuccess<StudentSubject>>(ENDPOINTS.studentSubjectItems.create, input);
  return data.data;
}

export async function updateStudentSubject(
  id: string,
  input: UpdateStudentSubjectInput,
): Promise<StudentSubject> {
  const { data } = await request.patch<ApiSuccess<StudentSubject>>(
    ENDPOINTS.studentSubjectItems.detail(id),
    input,
  );
  return data.data;
}

export async function removeStudentSubject(id: string): Promise<void> {
  await request.delete(ENDPOINTS.studentSubjectItems.detail(id));
}

/** "Đã xóa gần đây": soft-deleted items, for the restore dialog. */
export async function listTrashedStudentSubjects(
  filters: StudentSubjectFilters = {},
): Promise<ApiSuccess<StudentSubject[]>> {
  const { data } = await request.get<ApiSuccess<StudentSubject[]>>(ENDPOINTS.studentSubjectItems.trash, {
    params: filters,
  });
  return data;
}

export async function restoreStudentSubject(id: string): Promise<StudentSubject> {
  const { data } = await request.post<ApiSuccess<StudentSubject>>(ENDPOINTS.studentSubjectItems.restore(id));
  return data.data;
}
