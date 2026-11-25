import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateLessonInput, Lesson, LessonFilters, UpdateLessonInput } from './types';

export async function listLessons(filters: LessonFilters = {}): Promise<ApiSuccess<Lesson[]>> {
  const { data } = await request.get<ApiSuccess<Lesson[]>>(ENDPOINTS.lessonItems.list, { params: filters });
  return data;
}

export async function createLesson(input: CreateLessonInput): Promise<Lesson> {
  const { data } = await request.post<ApiSuccess<Lesson>>(ENDPOINTS.lessonItems.create, input);
  return data.data;
}

export async function updateLesson(id: string, input: UpdateLessonInput): Promise<Lesson> {
  const { data } = await request.patch<ApiSuccess<Lesson>>(ENDPOINTS.lessonItems.detail(id), input);
  return data.data;
}

export async function removeLesson(id: string): Promise<void> {
  await request.delete(ENDPOINTS.lessonItems.detail(id));
}

export async function publishLesson(id: string): Promise<Lesson> {
  const { data } = await request.patch<ApiSuccess<Lesson>>(ENDPOINTS.lessonItems.publish(id), {});
  return data.data;
}

export async function archiveLesson(id: string): Promise<Lesson> {
  const { data } = await request.patch<ApiSuccess<Lesson>>(ENDPOINTS.lessonItems.archive(id), {});
  return data.data;
}
