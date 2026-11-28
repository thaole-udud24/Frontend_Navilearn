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
  subjectId?: string;
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
export interface ConceptDraft {
  aiAssistLogId: string;
  topic: string;
  valid: boolean;
  name: string;
  description: string;
}

export interface GeneratedTemplateStep {
  dayOffset: number;
  durationMin: number;
  theoryContent?: string;
  note: string;
}

export interface TemplateDraft {
  aiAssistLogId: string;
  valid: boolean;
  title: string;
  description: string;
  steps: GeneratedTemplateStep[];
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
  subjectId?: string;
}

export interface AskInput {
  question: string;
  concept?: string;
  assessmentItemId?: string;
}

export interface ExplainWrongInput {
  assessmentItemId: string;
  question: string;
}

export interface GenerateQuestionInput {
  concept: string;
  difficulty?: string;
  assessmentItemId?: string;
}

export interface EssayFeedbackInput {
  conceptId?: string;
  questionText: string;
  answerText: string;
  assessmentItemId?: string;
}

export interface GeneratedStudyPlan {
  plan: import('@/services/planning/types').Plan;
  valid: boolean;
}

// B6 "Giám sát" (admin) — real operational data only: no invented queue depth/latency/load chart.
export interface AiAssistOverviewRecentItem {
  _id: string;
  kind: AiAssistKind | string;
  valid: boolean;
  reported: boolean;
  createdAt: string;
  owner?: { _id: string; fullName?: string; email?: string } | null;
  concept?: { _id: string; name: string } | null;
}

export interface AiAssistAdminOverview {
  health: { dbConnected: boolean; dbState: string; uptimeSec: number };
  rateLimit: { scope: string; windowMs: number; max: number };
  aiRequests: {
    totalLast24h: number;
    invalidLast24h: number;
    reportedLast24h: number;
    recent: AiAssistOverviewRecentItem[];
  };
}

// A5 "Review Workspace" — a pending AI-generated question draft with only real flags: `valid` is
// the actual format check, `possibleDuplicate` a live exact-text match against the active bank for
// the same concept. No fabricated duplicate percentage.
export interface QuestionDraftReviewItem {
  aiAssistLogId: string;
  owner?: { _id: string; fullName?: string; email?: string } | null;
  concept?: { _id: string; name: string } | null;
  createdAt: string;
  valid: boolean;
  possibleDuplicate: boolean;
  text: string;
  options: { text: string; isCorrect?: boolean }[];
}
