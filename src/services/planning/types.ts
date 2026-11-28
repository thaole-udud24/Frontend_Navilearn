export type PlanStatus = 'proposed' | 'active' | 'superseded';
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
  /** Traceability link back to LessonItem when created from a template step or manual lesson pick. */
  lessonId?: string | null;
  /** Synced stage bookmark toggle. */
  bookmarked?: boolean;
}

/** Real curriculum-coverage %: distinct real leaf Concepts the plan's sessions carry, over the
 * subject's total leaf Concept count (planning.service.computeCoverage). null when it can't be
 * computed at all (no `goal` link, or the subject has no recorded knowledge tree) — never a faked
 * number. A session still carrying only the goal's root subject concept does not count as covering
 * anything specific. */
export interface PlanCoverage {
  coveredLeafCount: number;
  totalLeafCount: number;
  percent: number;
}

export interface Plan {
  _id: string;
  owner: string;
  title: string;
  status: PlanStatus;
  /** Why this plan was proposed (set by adaptive replan; absent for template/AI/manual plans). */
  reason?: string;
  /** The exam goal this plan serves — direct FK, set on create by all three creation paths (manual/
   * template/AI) and inherited on replan. null for plans created before this field existed. */
  goal: string | null;
  /** Server-computed; see PlanCoverage. Present on list/detail reads, absent right after a write
   * (addSession/updateSession/confirm don't recompute it — not needed for those responses). */
  coverage?: PlanCoverage | null;
  replaces: string | null;
  sessions: PlanSession[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanFilters {
  page?: number;
  limit?: number;
  status?: PlanStatus;
  concept?: string;
  subjectId?: string;
}

export interface CreatePlanInput {
  title: string;
  /** Links the new plan to this exam goal (ownership verified server-side). */
  goalId?: string;
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
  bookmarked?: boolean;
}

export type GoalStatus = 'draft' | 'active' | 'paused' | 'completed' | 'expired' | 'archived';

export interface Goal {
  _id: string;
  owner: string;
  concept: { _id: string; name: string } | string;
  title: string;
  deadline: string;
  importance: number;
  /** "Điểm mong muốn" — a 0-10 exam score (Phase C), not a mastery %. */
  targetScore?: number | null;
  examName?: string | null;
  startDate?: string | null;
  studyDays?: number | null;
  minutesPerDay?: number | null;
  restDays?: number[];
  examScope?: string | null;
  examFormat?: string | null;
  selfReportedScore?: number | null;
  /** Student's own `student-document` uploads attached to this goal. */
  documentIds?: string[];
  /** Shared/admin `asset` docs ("Kho chung") attached to this goal. */
  assetIds?: string[];
  status?: GoalStatus;
  wizardStep?: number | null;
  pauseReason?: string | null;
  examResultScore?: number | null;
  closingNote?: string | null;
  activatedAt?: string | null;
  pausedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PauseGoalInput {
  reason?: string;
}

export interface CloseGoalInput {
  examResultScore?: number;
  closingNote?: string;
}

export interface GoalFilters {
  page?: number;
  limit?: number;
  concept?: string;
  subjectId?: string;
}

export interface CreateGoalInput {
  concept: string;
  title: string;
  deadline: string;
  importance?: number;
  targetScore?: number;
  examName?: string;
  startDate?: string;
  studyDays?: number;
  minutesPerDay?: number;
  restDays?: number[];
  examScope?: string;
  examFormat?: string;
  selfReportedScore?: number;
  documentIds?: string[];
  assetIds?: string[];
}

export type UpdateGoalInput = Partial<CreateGoalInput>;

/** B2: any subset of the wizard fields, saved as-you-go so closing the dialog doesn't lose progress. */
export type DraftGoalInput = Partial<CreateGoalInput> & { wizardStep?: number };

/** Phase C step 2: returned inline on a draft save when the proposed dates/minutesPerDay clash
 * with another of the student's own active goals. */
export interface GoalOverlapWarning {
  subjects: string[];
  totalMinutesPerDay: number;
  overlapDays: number;
}

export type DraftGoalResult = Goal & { overlapWarning?: GoalOverlapWarning };

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

export type DailyTaskType = 'REVIEW_PREV' | 'THEORY' | 'EXAMPLE' | 'EXERCISE' | 'QUICK_CHECK' | 'FLASHCARD' | 'MIXED';

export interface DailyTaskBreakdownItem {
  type: Exclude<DailyTaskType, 'MIXED'>;
  label: string;
  minutes: number;
}

/** "Kế hoạch ngày" — derived grouping of one calendar day's sessions across active plans. */
export interface DailyTask {
  planId: string;
  sessionId: string;
  concept: string;
  title?: string;
  chapterTitle?: string;
  durationMin: number;
  status: SessionStatus;
  quizPassed?: boolean;
  startAt: string;
  questions?: string[];
  hasQuiz: boolean;
  taskType?: DailyTaskType;
  breakdown?: DailyTaskBreakdownItem[];
}

export interface DailyPlan {
  date: string;
  totalMinutes?: number;
  completedMinutes?: number;
  tasks: DailyTask[];
}
