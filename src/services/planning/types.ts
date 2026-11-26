export type PlanStatus = 'proposed' | 'active' | 'superseded' | 'rejected';
export type SessionStatus = 'planned' | 'done' | 'missed' | 'cancelled';
/** Chặng (stage) lock state, computed by the BE from the plan's sessions — never set by the client. */
export type StageStatus = 'locked' | 'available' | 'completed';

export interface PlanSession {
  _id: string;
  concept: string;
  startAt: string;
  durationMin: number;
  status: SessionStatus;
  /** Stage name — fall back to `note` for sessions created before this field existed. */
  title?: string;
  /** Chapter this stage belongs to, copied from the plan-template step on apply — display grouping
   * only, absent for sessions created before this field existed. */
  chapterTitle?: string;
  /** "Sau buổi này bạn có thể…" — read-only for the student, carried from the plan template. */
  objectives?: string[];
  note?: string;
  /** Short reading material for this session (UC-PLN-TPL-03), usually copied from a plan template step. */
  theoryContent?: string;
  /** Question ids from the question bank — answering them (see submitSessionQuiz) is required before "done". */
  questions?: string[];
  /** True once the attached quiz has been passed; gates marking the session "done" when questions.length > 0. */
  quizPassed?: boolean;
  /** Sequential stage gate — BE also rejects "done"/quiz submit for a 'locked' session, this is just the label. */
  stageStatus?: StageStatus;
}

export interface Plan {
  _id: string;
  owner: string;
  title: string;
  status: PlanStatus;
  replaces: string | null;
  /** BR-54: BE bật khi đề xuất 'proposed' chờ quá 5 phút chưa được xác nhận/từ chối — FE hiện nhắc. */
  confirmReminder?: boolean;
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
  sessions?: Array<{ concept: string; startAt: string; durationMin: number; title: string }>;
}

export interface AddSessionInput {
  concept: string;
  startAt: string;
  durationMin: number;
  title: string;
  objectives?: string[];
  theoryContent?: string;
  questions?: string[];
}

export interface UpdateSessionInput {
  concept?: string;
  startAt?: string;
  durationMin?: number;
  title?: string;
  objectives?: string[];
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
  /** Student-set aspiration (e.g. "Mastery ≥ 80%") — never the measured Mastery score itself. */
  targetScore?: number | null;
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
  targetScore?: number;
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
