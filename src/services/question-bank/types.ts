export type QuestionType = 'mcq' | 'essay';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'active' | 'archived';

export interface QuestionOption {
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  _id: string;
  concept: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  referenceAnswer?: string;
  difficulty: QuestionDifficulty;
  points: number;
  status: QuestionStatus;
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
