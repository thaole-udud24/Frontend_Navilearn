import type { RecordSource } from '@/types/api.d';

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

export type QuestionType = 'mcq' | 'true_false' | 'essay';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'active' | 'archived';

export interface QuestionOption {
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  _id: string;
  owner: string;
  concept: { _id: string; name: string } | string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  referenceAnswer?: string;
  difficulty: QuestionDifficulty;
  points: number;
  status: QuestionStatus;
  source?: RecordSource;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFilters {
  page?: number;
  limit?: number;
  concept?: string;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  status?: QuestionStatus;
}

export interface CreateQuestionInput {
  concept: string;
  type?: QuestionType;
  text: string;
  options?: QuestionOption[];
  referenceAnswer?: string;
  difficulty?: QuestionDifficulty;
  points?: number;
}

export type UpdateQuestionInput = Partial<CreateQuestionInput>;

export interface ImportRowResult {
  createdCount: number;
  createdIds: string[];
  errorCount: number;
  errors: { row: number; message: string }[];
}

export interface QuestionQualityStat {
  question: string;
  text: string;
  attempts: number;
  correctRatePercent: number | null;
  openIssueCount: number;
}

export type DuplicateGroup = { id: string; text: string }[];

export type IssueReportStatus = 'open' | 'resolved' | 'dismissed';

export interface QuestionIssueReport {
  _id: string;
  question: string | { _id: string; text: string };
  reportedBy: string;
  reason: string;
  description?: string;
  status: IssueReportStatus;
  resolution?: string;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface IssueReportFilters {
  page?: number;
  limit?: number;
  status?: IssueReportStatus;
}

export interface FromAiDraftInput {
  aiAssistLogId: string;
  concept?: string;
  text?: string;
  options?: QuestionOption[];
  difficulty?: QuestionDifficulty;
  points?: number;
}
