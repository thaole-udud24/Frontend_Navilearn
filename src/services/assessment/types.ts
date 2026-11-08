export type AssessmentStatus = 'in_progress' | 'submitted';

export interface AssessmentAnswer {
  question: string;
  selectedOptionIndex?: number;
  essayText?: string;
  isCorrect?: boolean;
  earnedPoints?: number;
  feedback?: string;
}

export interface Assessment {
  _id: string;
  assessmentConfig: string;
  concept: string;
  answers: AssessmentAnswer[];
  status: AssessmentStatus;
  score: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentFilters {
  page?: number;
  limit?: number;
  status?: AssessmentStatus;
}

export interface SubmitAssessmentInput {
  answers: { question: string; selectedOptionIndex?: number; essayText?: string }[];
}
