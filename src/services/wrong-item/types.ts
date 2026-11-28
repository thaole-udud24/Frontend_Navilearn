export type WrongItemStatus = 'open' | 'mastered';

export interface WrongItemQuestion {
  _id: string;
  text: string;
  type: string;
  explanation?: string;
  options?: Array<{ text: string; isCorrect?: boolean }>;
}

export interface WrongItem {
  _id: string;
  owner: string;
  question: WrongItemQuestion | string;
  concept: { _id: string; name: string } | string;
  wrongCount: number;
  lastWrongAt: string;
  status: WrongItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WrongItemFilters {
  page?: number;
  limit?: number;
  subject?: string;
  subjectId?: string;
  concept?: string;
  status?: WrongItemStatus;
}
