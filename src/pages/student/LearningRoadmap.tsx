import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Flag,
  GitBranch,
  ListChecks,
  Lock,
  Play,
  PlayCircle,
  Plus,
  Star,
  Target,
  X,
} from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import { cn } from '@/lib/utils';
import { listPlans, listGoals, updateSession } from '@/services/planning';
import { planningKeys } from '@/services/planning/queryKeys';
import { listConcepts } from '@/services/knowledge';
import { knowledgeKeys } from '@/services/knowledge/queryKeys';
import { getQuestion } from '@/services/question-bank';
import { RoadmapTree } from './components/RoadmapTree';
import { SessionQuizDialog } from './components/SessionQuizDialog';
import type { Goal, Plan, PlanSession } from '@/services/planning/types';
import type { Concept } from '@/services/knowledge/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function pct(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function fmtH(min: number) {
  return `${Math.round((min / 60) * 10) / 10}h`;
}

// ─── Stage status chip ────────────────────────────────────────────────────────

type StageState = 'done' | 'active' | 'locked';

function stageState(s: PlanSession): StageState {
  if (s.status === 'done') return 'done';
  if (s.stageStatus === 'locked') return 'locked';
  return 'active';
}

const STATE_DOT: Record<StageState, string> = {
  done: 'bg-success text-white',
  active: 'bg-primary text-primary-foreground',
  locked: 'bg-muted-foreground/60 text-background',
};

// ─── Left panel: chapter/concept tree ────────────────────────────────────────

interface ChapterPanelProps {
  concepts: Concept[];
  sessions: PlanSession[];
  selectedConceptId: string | null;
  onSelect: (id: string) => void;
  /** The goal's own subject (a top-level Concept) — "chapters" are ITS direct children, not every
   * top-level Concept in the bank (that would mix every subject's chapters into one flat list). */
  subjectId?: string;
}

function ChapterPanel({ concepts, sessions, selectedConceptId, onSelect, subjectId }: ChapterPanelProps) {
  // Group by parentConcept — chapters are the subject's direct children, their children are topics.
  const chapters = concepts.filter((c) => {
    const p = c.parentConcept;
    return (typeof p === 'string' ? p : p?._id) === subjectId;
  });
  const childrenOf = (parentId: string) =>
    concepts.filter((c) => {
      const p = c.parentConcept;
      return (typeof p === 'string' ? p : p?._id) === parentId;
    });

  const sessionConceptIds = new Set(sessions.map((s) => s.concept));
  const doneConceptIds = new Set(sessions.filter((s) => s.status === 'done').map((s) => s.concept));

  const [expanded, setExpanded] = useState<Set<string>>(new Set(chapters.slice(0, 1).map((c) => c._id)));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <p className="text-xs font-semibold text-muted-foreground">Giáo trình môn học</p>
        <p className="text-xs text-muted-foreground">
          {chapters.length} chương · {concepts.length} chủ đề
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chapters.map((ch, ci) => {
          const kids = childrenOf(ch._id);
          const isOpen = expanded.has(ch._id);
          const doneKids = kids.filter((k) => doneConceptIds.has(k._id)).length;
          const totalKids = kids.length || (sessionConceptIds.has(ch._id) ? 1 : 0);
          const chDone = sessionConceptIds.has(ch._id) && doneConceptIds.has(ch._id);

          return (
            <div key={ch._id}>
              <button
                type="button"
                onClick={() => {
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (next.has(ch._id)) next.delete(ch._id);
                    else next.add(ch._id);
                    return next;
                  });
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50',
                  selectedConceptId === ch._id && 'bg-primary/10 font-semibold text-primary',
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground">
                  {ci + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{ch.name}</span>
                {chDone && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />}
                {kids.length > 0 &&
                  (isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ))}
              </button>

              {isOpen && kids.length > 0 && (
                <div className="ml-6 border-l border-border">
                  {kids.map((kid) => {
                    const kidDone = doneConceptIds.has(kid._id);
                    const isSelected = selectedConceptId === kid._id;
                    return (
                      <button
                        key={kid._id}
                        type="button"
                        onClick={() => onSelect(kid._id)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/50',
                          isSelected ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground',
                        )}
                      >
                        {kidDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/40" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{kid.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* If no children, show progress badge */}
              {isOpen && kids.length === 0 && totalKids > 0 && (
                <div className="ml-8 px-2 py-1 text-xs text-muted-foreground">
                  {doneKids}/{totalKids} buổi hoàn thành
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Middle panel: chapter/stage list ────────────────────────────────────────

interface StagePanelProps {
  sessions: PlanSession[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filterConceptId: string | null;
}

function StagePanel({ sessions, selectedId, onSelect, filterConceptId }: StagePanelProps) {
  const ordered = useMemo(
    () => [...sessions].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [sessions],
  );

  // Group by "parent concept" (chapter) — sessions don't have chapter info so we group by startAt date roughly
  // We show all, optionally filtered
  const visible = filterConceptId ? ordered.filter((s) => s.concept === filterConceptId) : ordered;

  // Further group by concept for chapter headings
  const groups: { conceptId: string; sessions: PlanSession[] }[] = [];
  for (const s of visible) {
    const last = groups[groups.length - 1];
    if (last && last.conceptId === s.concept) {
      last.sessions.push(s);
    } else {
      groups.push({ conceptId: s.concept, sessions: [s] });
    }
  }

  if (visible.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Chưa có chặng học nào.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-3 gap-3">
      {visible.map((s, idx) => {
        const state = stageState(s);
        const isSelected = s._id === selectedId;
        const doneQ = s.quizPassed ? (s.questions?.length ?? 0) : 0;
        const totalQ = s.questions?.length ?? 0;
        const hasProgress = s.status === 'done' || (totalQ > 0 && doneQ > 0);
        const progressPct = totalQ > 0 ? pct(doneQ, totalQ) : s.status === 'done' ? 100 : 0;

        return (
          <button
            key={s._id}
            type="button"
            onClick={() => onSelect(s._id)}
            className={cn(
              'w-full rounded-card border p-3 text-left transition-all',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md'
                : state === 'done'
                  ? 'border-success/30 bg-card'
                  : state === 'locked'
                    ? 'border-border bg-muted/30 opacity-60'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5',
            )}
          >
            {/* Header row */}
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    STATE_DOT[state],
                  )}
                >
                  {state === 'done' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : state === 'locked' ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </span>
                <p className="text-xs font-semibold text-muted-foreground">
                  Chặng {idx + 1} ·{' '}
                  {new Date(s.startAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-badge px-1.5 py-0.5 text-[10px] font-semibold',
                  state === 'done'
                    ? 'bg-success/10 text-success'
                    : state === 'active'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {state === 'done' ? 'Đã hoàn thành ✓' : state === 'active' ? 'Đang học' : 'Đang khóa'}
              </span>
            </div>

            {/* Title */}
            <p className="mb-1 text-sm font-semibold text-foreground leading-snug">
              {s.title ?? 'Chặng học'}
            </p>

            {/* Description / objectives */}
            {(s.objectives?.length ?? 0) > 0 && (
              <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{s.objectives![0]}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> {s.theoryContent ? '1 bài học' : '—'}
              </span>
              <span className="flex items-center gap-1">
                <ListChecks className="h-3 w-3" /> {totalQ} bài luyện tập
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> ~{s.durationMin} phút
              </span>
            </div>

            {/* Progress bar (only for active/done) */}
            {hasProgress && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      state === 'done' ? 'bg-success' : 'bg-primary',
                    )}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{progressPct}%</p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Right panel: stage inspector ────────────────────────────────────────────

interface StageInspectorProps {
  session: PlanSession;
  planId: string;
  onClose: () => void;
  onStartQuiz: (sessionId: string) => void;
  onDone: (sessionId: string) => void;
}

function StageInspectorPanel({ session, onClose, onStartQuiz, onDone }: StageInspectorProps) {
  const [tab, setTab] = useState<'content' | 'practice' | 'info'>('content');
  const locked = session.stageStatus === 'locked';
  const hasQuiz = (session.questions?.length ?? 0) > 0;
  const state = stageState(session);

  const ids = session.questions ?? [];
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['session-questions', session._id, ids.join(',')],
    queryFn: () => Promise.all(ids.map((id) => getQuestion(id))),
    enabled: ids.length > 0,
  });

  return (
    <aside className="flex h-full flex-col overflow-hidden border-l border-border bg-card">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {session.title?.split('·')[0]?.trim() ?? 'Chặng'}
          </p>
          <h3 className="mt-0.5 break-words text-sm font-bold text-foreground">
            {session.title ?? 'Chặng học'}
          </h3>
          {locked && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Cần hoàn thành chặng trước để mở khóa
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-border">
        {(['content', 'practice', 'info'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 text-xs font-medium transition-colors',
              tab === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'content' ? 'Nội dung học' : t === 'practice' ? 'Luyện tập' : 'Thông tin'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'content' && (
          <div className="flex flex-col gap-3">
            {session.theoryContent ? (
              <div className="rounded-card border border-border p-3">
                <TheoryBlockViewer raw={session.theoryContent} />
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-6">
                Chặng này chưa có nội dung lý thuyết.
              </p>
            )}

            {/* Related concepts / knowledge chips */}
            {(session.objectives?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  Kiến thức liên quan
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {session.objectives!.map((o, idx) => (
                    <span
                      key={idx}
                      className="rounded-badge bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'practice' && (
          <div className="flex flex-col gap-3">
            {!hasQuiz ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Chặng này chưa có bài luyện tập.
              </p>
            ) : (
              <>
                {questionsLoading ? (
                  <p className="text-center text-xs text-muted-foreground">Đang tải…</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {(questions ?? []).map((q) => (
                      <li
                        key={q._id}
                        className="flex items-center gap-2 rounded-control border border-border p-2.5 text-xs"
                      >
                        {session.quizPassed ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/40" />
                        )}
                        <span className="min-w-0 flex-1 text-foreground">
                          {typeof q.concept === 'string' ? q.concept : q.concept.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" size="sm" disabled={locked} onClick={() => onStartQuiz(session._id)}>
                  <ListChecks className="h-4 w-4" />
                  {session.quizPassed ? 'Làm lại bài tập' : 'Bắt đầu luyện tập'}
                </Button>
              </>
            )}
          </div>
        )}

        {tab === 'info' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 rounded-card border border-border p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Thời lượng: <strong className="text-foreground">{session.durationMin} phút</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ListChecks className="h-3.5 w-3.5" />
                <span>
                  Câu hỏi: <strong className="text-foreground">{session.questions?.length ?? 0}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5" />
                <span>
                  Ngày:{' '}
                  <strong className="text-foreground">
                    {new Date(session.startAt).toLocaleDateString('vi-VN')}
                  </strong>
                </span>
              </div>
            </div>

            {(session.objectives?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  Sau chặng này bạn có thể
                </p>
                <ul className="flex flex-col gap-1">
                  {session.objectives!.map((o, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-foreground">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA footer */}
      {!locked && state !== 'done' && (
        <div className="shrink-0 border-t border-border p-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (hasQuiz && !session.quizPassed) {
                onStartQuiz(session._id);
              } else {
                onDone(session._id);
              }
            }}
          >
            <PlayCircle className="h-4 w-4" />
            {hasQuiz && !session.quizPassed
              ? 'Làm trắc nghiệm để hoàn thành'
              : 'Học tiếp: ' + (session.title ?? 'Chặng này')}
          </Button>
        </div>
      )}
    </aside>
  );
}

// ─── Top overview strip ───────────────────────────────────────────────────────

interface OverviewStripProps {
  plan: Plan;
  goal?: Goal;
  onViewRoadmapTree: () => void;
}

function OverviewStrip({ plan, goal, onViewRoadmapTree }: OverviewStripProps) {
  const ordered = plan.sessions;
  const done = ordered.filter((s) => s.status === 'done').length;
  const totalMin = ordered.reduce((s, x) => s + x.durationMin, 0);
  const doneMin = ordered.filter((s) => s.status === 'done').reduce((s, x) => s + x.durationMin, 0);
  const prog = pct(done, ordered.length);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-card px-4 py-3 shadow-card">
      <div className="flex shrink-0 items-center gap-2 rounded-control border border-border bg-muted/40 px-3 py-1.5">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {goal ? (typeof goal.concept === 'string' ? goal.concept : goal.concept.name) : plan.title}
        </span>
      </div>

      {/* The plan's own chặng sequence (zigzag tree), same component/style as Admin's "Bản đồ lộ
       * trình" for a Plan Template — a different diagram from Bản đồ tri thức, which is about
       * Concept prerequisite relationships, not the built study plan. */}
      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onViewRoadmapTree}>
        <GitBranch className="h-3.5 w-3.5" /> Xem sơ đồ cây lộ trình
      </Button>

      <div className="flex flex-1 flex-wrap items-center gap-4">
        {/* Progress bar */}
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tiến độ tổng quan</span>
            <span className="text-xs font-bold text-primary">{prog}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${prog}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1.5 rounded-control border border-border px-2.5 py-1.5">
          <Flag className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {done}/{ordered.length}
          </span>
          <span className="text-xs text-muted-foreground">Chặng đã hoàn thành</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-control border border-border px-2.5 py-1.5">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-foreground">
            {fmtH(doneMin)} / {fmtH(totalMin)}
          </span>
          <span className="text-xs text-muted-foreground">Thời gian học</span>
        </div>

        {/* Real targetScore the student set when creating the goal — never goal.importance (a 1-5
         * priority, not a score) and never shown at all when the goal has no target set. */}
        {goal?.targetScore != null && (
          <div className="flex items-center gap-1.5 rounded-control border border-border px-2.5 py-1.5">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-semibold text-foreground">Mục tiêu: ≥ {goal.targetScore}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onGoPlanner }: { onGoPlanner: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-card border border-dashed border-border text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Target className="h-8 w-8 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Chưa có lộ trình học tập</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Đặt mục tiêu và chọn lộ trình mẫu để bắt đầu hành trình học tập.
        </p>
      </div>
      <Button type="button" onClick={onGoPlanner}>
        <Plus className="h-4 w-4" /> Tạo lộ trình mới
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LearningRoadmapPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [filterConceptId, setFilterConceptId] = useState<string | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [roadmapTreeOpen, setRoadmapTreeOpen] = useState(false);

  // Data fetching
  const { data: plansRes } = useQuery({
    queryKey: planningKeys.plans({ limit: 20 }),
    queryFn: () => listPlans({ limit: 20 }),
  });
  const activePlan = (plansRes?.data ?? []).find((p) => p.status === 'active') ?? null;

  const { data: goalsRes } = useQuery({
    queryKey: planningKeys.goals({ limit: 50 }),
    queryFn: () => listGoals({ limit: 50 }),
  });

  // Find the goal that matches the active plan's first session concept
  const activeGoal = useMemo(() => {
    if (!activePlan || !goalsRes) return undefined;
    const firstConcept = activePlan.sessions[0]?.concept;
    return goalsRes.data.find((g) => {
      const gc = typeof g.concept === 'string' ? g.concept : g.concept._id;
      return gc === firstConcept;
    });
  }, [activePlan, goalsRes]);

  // Load concepts for the goal's subject (parentConcept=null gives chapters)
  const goalConceptId = activeGoal
    ? typeof activeGoal.concept === 'string'
      ? activeGoal.concept
      : activeGoal.concept._id
    : undefined;

  const { data: conceptsRes } = useQuery({
    queryKey: knowledgeKeys.list({ limit: 100, status: 'active' }),
    queryFn: () => listConcepts({ limit: 100, status: 'active' }),
    enabled: !!activePlan,
  });
  const concepts = conceptsRes?.data ?? [];

  // Session actions
  const invalidatePlans = () => queryClient.invalidateQueries({ queryKey: planningKeys.all });

  const doneMutation = useMutation({
    mutationFn: (sessionId: string) => updateSession(activePlan!._id, sessionId, { status: 'done' }),
    onSuccess: () => {
      toast.success('Đã hoàn thành chặng học!');
      invalidatePlans();
    },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const ordered = useMemo(
    () =>
      [...(activePlan?.sessions ?? [])].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [activePlan],
  );

  const selectedSession = ordered.find((s) => s._id === selectedSessionId) ?? null;
  const nextSession = ordered.find((s) => s.status === 'planned' && s.stageStatus !== 'locked');

  return (
    <AppShell
      menu={studentMenu}
      title="Lộ trình học tập"
      breadcrumb={['Trang chủ', 'Lộ trình học tập']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-control bg-primary/10 text-primary">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Lộ trình học tập</h1>
            <p className="text-xs text-muted-foreground">
              Theo dõi tiến độ, hoàn thành các chặng và đạt mục tiêu học tập của bạn.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(PATHS.student.planner)}>
            Mục tiêu &amp; lịch học
          </Button>
          <Button type="button" size="sm" onClick={() => navigate(PATHS.student.planner)}>
            <Plus className="h-4 w-4" /> Tạo lộ trình mới
          </Button>
        </div>
      </div>

      {/* This page only has one real view (the plan's own chặng tree) — "Mục tiêu & lịch học" above
       * is a plain link to Planner, not a fake tab: Tabs hijacked by onClick-navigate used to fight
       * Radix's own tab-switch animation and glitch mid-click before the route actually changed. */}
      {!activePlan ? (
        <EmptyState onGoPlanner={() => navigate(PATHS.student.planner)} />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Overview strip */}
          <OverviewStrip
            plan={activePlan}
            goal={activeGoal}
            onViewRoadmapTree={() => setRoadmapTreeOpen(true)}
          />

          {/* "Học tiếp" CTA */}
          {nextSession && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setSelectedSessionId(nextSession._id)}
                className="w-fit"
              >
                <PlayCircle className="h-4 w-4" />
                Học tiếp: {nextSession.title ?? 'Chặng tiếp theo'}
              </Button>
            </div>
          )}

          {/* Three-panel layout */}
          <div
            className={cn(
              'grid overflow-hidden rounded-card border border-border bg-card shadow-card',
              'transition-all duration-200',
              selectedSession
                ? 'grid-cols-[220px_1fr_320px] lg:grid-cols-[240px_1fr_340px]'
                : 'grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]',
            )}
            style={{ minHeight: '60vh', maxHeight: '72vh' }}
          >
            {/* Panel 1: Chapter tree */}
            <div className="overflow-hidden border-r border-border">
              <ChapterPanel
                concepts={concepts}
                sessions={ordered}
                subjectId={goalConceptId}
                selectedConceptId={filterConceptId}
                onSelect={(id) => {
                  setFilterConceptId((prev) => (prev === id ? null : id));
                  setSelectedSessionId(null);
                }}
              />
            </div>

            {/* Panel 2: Stage list */}
            <div className="overflow-hidden">
              {/* Sub-header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {filterConceptId
                      ? (concepts.find((c) => c._id === filterConceptId)?.name ?? 'Chặng học')
                      : 'Tất cả các chặng'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ordered.filter((s) => (filterConceptId ? s.concept === filterConceptId : true)).length}{' '}
                    chặng · ước tính{' '}
                    {fmtH(
                      ordered
                        .filter((s) => (filterConceptId ? s.concept === filterConceptId : true))
                        .reduce((sum, s) => sum + s.durationMin, 0),
                    )}
                  </p>
                </div>
                {filterConceptId && (
                  <button
                    type="button"
                    onClick={() => setFilterConceptId(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>
              <StagePanel
                sessions={ordered}
                selectedId={selectedSessionId}
                onSelect={setSelectedSessionId}
                filterConceptId={filterConceptId}
              />
            </div>

            {/* Panel 3: Stage inspector (conditional) */}
            {selectedSession && (
              <StageInspectorPanel
                session={selectedSession}
                planId={activePlan._id}
                onClose={() => setSelectedSessionId(null)}
                onStartQuiz={(id) => setQuizSessionId(id)}
                onDone={(id) => doneMutation.mutate(id)}
              />
            )}
          </div>
        </div>
      )}

      {/* Quiz dialog */}
      {activePlan && (
        <SessionQuizDialog
          planId={activePlan._id}
          sessionId={quizSessionId}
          questionIds={activePlan.sessions.find((s) => s._id === quizSessionId)?.questions ?? []}
          onClose={() => setQuizSessionId(null)}
          onPassed={() => {
            doneMutation.mutate(quizSessionId!);
            setQuizSessionId(null);
          }}
        />
      )}

      {/* Roadmap tree — same zigzag chặng diagram pattern as Admin's "Bản đồ lộ trình" for a plan
       * template, applied to this student's own built plan sessions. Not the Knowledge Map: that
       * diagram is about Concept prerequisite relationships, a different thing entirely. */}
      {activePlan && (
        <Dialog open={roadmapTreeOpen} onOpenChange={setRoadmapTreeOpen}>
          <DialogContent size="xl" className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sơ đồ cây lộ trình</DialogTitle>
            </DialogHeader>
            <RoadmapTree sessions={activePlan.sessions} readOnly />
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
