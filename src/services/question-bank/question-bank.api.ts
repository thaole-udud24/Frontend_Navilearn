import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CreateQuestionInput, Question, QuestionFilters } from './types';

export async function listQuestions(filters: QuestionFilters): Promise<ApiSuccess<Question[]>> {
  const { data } = await request.get<ApiSuccess<Question[]>>(ENDPOINTS.questionBankItems.list, { params: filters });
  return data;
}

export async function getQuestion(id: string): Promise<Question> {
  const { data } = await request.get<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.detail(id));
  return data.data;
}

export async function createQuestion(input: CreateQuestionInput): Promise<Question> {
  const { data } = await request.post<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.create, input);
  return data.data;
}

export async function archiveQuestion(id: string): Promise<Question> {
  const { data } = await request.patch<ApiSuccess<Question>>(ENDPOINTS.questionBankItems.updateStatus(id), {
    status: 'archived',
  });
  return data.data;
}
