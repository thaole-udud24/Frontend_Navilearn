export type QuestionBankItemStatus = 'open' | 'in_progress' | 'resolved';

export interface QuestionBankItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: QuestionBankItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBankItemFilters {
  page?: number;
  limit?: number;
  status?: QuestionBankItemStatus;
}

export interface CreateQuestionBankItemInput {
  title: string;
  content: string;
}
