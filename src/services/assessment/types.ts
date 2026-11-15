export type AssessmentItemStatus = 'open' | 'in_progress' | 'resolved';
export type AssessmentStatus = 'in_progress' | 'submitted' | 'graded';

export interface AssessmentItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: AssessmentItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentAnswer {
  question: string;
  selectedOptionIndex?: number;
  essayText?: string;
  isCorrect?: boolean;
  earnedPoints?: number;
  feedback?: string;
  flagged?: boolean;
  /** Only present on a submitted attempt returned by GET /:id (enriched server-side). */
  questionText?: string;
  correctAnswer?: string;
}

export interface Assessment {
  _id: string;
  assessmentConfig: string;
  concept: string;
  questionsOverride: string[];
  answers: AssessmentAnswer[];
  status: AssessmentStatus;
  score: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentItemFilters {
  page?: number;
  limit?: number;
  status?: AssessmentItemStatus;
}

export interface AssessmentFilters {
  page?: number;
  limit?: number;
  status?: AssessmentStatus;
  concept?: string;
}

export interface SubmitAssessmentInput {
  answers: AssessmentAnswer[];
}

export interface CreateAssessmentItemInput {
  title: string;
  content: string;
}

export interface CompareResult {
  concept: string;
  attempts: { id: string; score: number; passed: boolean; submittedAt: string }[];
  deltaFromFirst: number;
}

export interface ScoreHistoryEntry {
  score: number;
  reason: string;
  changedBy?: string;
  at?: string;
}
