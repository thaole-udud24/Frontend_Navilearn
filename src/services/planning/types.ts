export type PlanStatus = 'proposed' | 'active' | 'superseded';
export type SessionStatus = 'planned' | 'done' | 'missed' | 'cancelled';

export interface PlanSession {
  _id: string;
  concept: string;
  startAt: string;
  durationMin: number;
  status: SessionStatus;
  note?: string;
  /** Short reading material for this session (UC-PLN-TPL-03), usually copied from a plan template step. */
  theoryContent?: string;
  /** Question ids from the question bank — answering them (see submitSessionQuiz) is required before "done". */
  questions?: string[];
  /** True once the attached quiz has been passed; gates marking the session "done" when questions.length > 0. */
  quizPassed?: boolean;
}

export interface Plan {
  _id: string;
  owner: string;
  title: string;
  status: PlanStatus;
  replaces: string | null;
  sessions: PlanSession[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanFilters {
  page?: number;
  limit?: number;
  status?: PlanStatus;
}

export interface CreatePlanInput {
  title: string;
  sessions?: Array<{ concept: string; startAt: string; durationMin: number }>;
}

export interface AddSessionInput {
  concept: string;
  startAt: string;
  durationMin: number;
  theoryContent?: string;
  questions?: string[];
}

export interface UpdateSessionInput {
  concept?: string;
  startAt?: string;
  durationMin?: number;
  status?: 'done' | 'cancelled';
  note?: string;
}

export interface Goal {
  _id: string;
  owner: string;
  concept: { _id: string; name: string } | string;
  title: string;
  deadline: string;
  importance: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalFilters {
  page?: number;
  limit?: number;
}

export interface CreateGoalInput {
  concept: string;
  title: string;
  deadline: string;
  importance?: number;
}

export type UpdateGoalInput = Partial<CreateGoalInput>;

export interface SessionQuizAnswer {
  questionId: string;
  selectedOptionIndex: number;
}

export interface SessionQuizResult {
  scorePercent: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
}
