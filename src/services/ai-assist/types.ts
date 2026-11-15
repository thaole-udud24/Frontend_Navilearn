export type AiAssistItemStatus = 'open' | 'in_progress' | 'resolved';

export interface AiAssistItem {
  _id: string;
  owner: string;
  title: string;
  content: string;
  status: AiAssistItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AiAssistItemFilters {
  page?: number;
  limit?: number;
  status?: AiAssistItemStatus;
}

export interface CreateAiAssistItemInput {
  title: string;
  content: string;
}

export interface DraftQuestion {
  aiAssistLogId: string;
  concept: string;
  difficulty: string;
  valid: boolean;
  text: string;
  options: { text: string; isCorrect?: boolean }[];
}

export type AiAssistKind =
  | 'generate_question'
  | 'practice_question'
  | 'grade_essay'
  | 'essay_feedback'
  | 'qa'
  | 'explain_wrong';

export interface AiAssistSource {
  concept?: string;
  label: string;
}

export interface AiAssistLog {
  _id: string;
  concept: string | null;
  kind: AiAssistKind;
  prompt: string;
  response: string;
  sources?: AiAssistSource[];
  rating?: number;
  ratingComment?: string;
  reported?: boolean;
  reportReason?: string;
  createdAt: string;
}

export interface AiAssistFilters {
  page?: number;
  limit?: number;
  kind?: AiAssistKind;
}

export interface AskInput {
  question: string;
  concept?: string;
}

export interface ExplainWrongInput {
  assessmentItemId: string;
  question: string;
}

export interface GenerateQuestionInput {
  concept: string;
  difficulty?: string;
}

export interface EssayFeedbackInput {
  conceptId?: string;
  questionText: string;
  answerText: string;
}
