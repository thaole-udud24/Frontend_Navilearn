import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  ListChecks,
  Lock,
  PlayCircle,
  Share2,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import { cn } from '@/lib/utils';
import { getQuestion } from '@/services/question-bank';
import { getConcept } from '@/services/knowledge';
import { listMasteries } from '@/services/mastery';
import type { Plan, PlanSession } from '@/services/planning/types';
import type { Goal } from '@/services/planning/types';

// Sessions created before `chapterTitle` existed (or a manually-built plan with no template
// behind it) fall into one unlabeled group instead of showing an empty/fake chapter header.
const UNGROUPED = '__ungrouped__';

/** "Nội dung học" inside the inspector — the real Concept each question in this session covers
 * (one question per Concept by seed convention), not a fabricated lesson/video list — plus
 * "Kiến thức liên quan": the real `prerequisites`/`related` of those concepts (Kho tri thức data),
 * each marked done/locked from the student's real Mastery, never a static decorative list. */
function StageContentTab({ session }: { session: PlanSession }) {
  const ids = session.questions ?? [];
  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ['session-stage-questions', session._id, ids],
    queryFn: () => Promise.all(ids.map((id) => getQuestion(id))),
    enabled: ids.length > 0,
  });
  const conceptIds = useMemo(
    () => [
      ...new Set((questions ?? []).map((q) => (typeof q.concept === 'string' ? q.concept : q.concept._id))),
    ],
    [questions],
  );

  const { data: concepts } = useQuery({
    queryKey: ['session-stage-concepts', conceptIds],
    queryFn: () => Promise.all(conceptIds.map((id) => getConcept(id))),
    enabled: conceptIds.length > 0,
  });
  const { data: masteryRes } = useQuery({
    queryKey: ['session-stage-mastery'],
    queryFn: () => listMasteries({ limit: 200 }),
    enabled: conceptIds.length > 0,
  });
  const masteredIds = useMemo(() => {
    const set = new Set<string>();
    (masteryRes?.data ?? []).forEach((m) => {
      if (m.learningState === 'UNDERSTOOD' || m.learningState === 'APPLIED') {
        set.add(typeof m.concept === 'string' ? m.concept : m.concept._id);
      }
    });
    return set;
  }, [masteryRes]);

  const related = useMemo(() => {
    const ownIds = new Set(conceptIds);
    const map = new Map<string, string>();
    (concepts ?? []).forEach((c) => {
      [...(c.prerequisites ?? []), ...(c.related ?? [])].forEach((r) => {
        const rId = typeof r === 'string' ? r : r._id;
        const rName = typeof r === 'string' ? r : r.name;
        if (!ownIds.has(rId)) map.set(rId, rName);
      });
    });
    return [...map.entries()];
  }, [concepts, conceptIds]);

  if (ids.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chặng này chưa gắn câu hỏi/kiến thức cụ thể nào.
      </p>
    );
  }
  if (loadingQuestions) return <p className="py-6 text-center text-sm text-muted-foreground">Đang tải…</p>;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {(questions ?? []).map((q) => (
          <li
            key={q._id}
            className="flex items-center gap-2.5 rounded-control border border-border p-2.5 text-sm"
          >
            {session.status === 'done' || session.quizPassed ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {typeof q.concept === 'string' ? q.concept : q.concept.name}
            </span>
          </li>
        ))}
      </ul>

      {related.length > 0 && (
        <div>
          <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
            <Share2 className="h-3.5 w-3.5" /> Kiến thức liên quan
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {related.map(([id, name]) => {
              const done = masteredIds.has(id);
              return (
                <span
                  key={id}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                    done
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-border bg-muted/30 text-muted-foreground',
                  )}
                >
                  {done ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StageInspector({
  session,
  onStartQuiz,
}: {
  session: PlanSession;
  onStartQuiz: (sessionId: string) => void;
}) {
  const locked = session.stageStatus === 'locked';
  const hasQuiz = (session.questions?.length ?? 0) > 0;

  return (
    <aside className="flex h-full w-full flex-col gap-3 rounded-card border border-border bg-card p-4 shadow-card lg:w-[340px] lg:shrink-0">
      <div>
        <h3 className="font-bold text-foreground">{session.title ?? 'Chặng học'}</h3>
        {locked && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Lock className="h-3 w-3" /> Cần hoàn thành chặng trước để mở khoá
          </p>
        )}
      </div>

      <Tabs defaultValue="content">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Nội dung học</TabsTrigger>
          <TabsTrigger value="practice">Luyện tập</TabsTrigger>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="mt-3">
          <StageContentTab session={session} />
        </TabsContent>
        <TabsContent value="practice" className="mt-3">
          {!hasQuiz ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Chặng này chưa có bài luyện tập.</p>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <ListChecks className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                {session.questions!.length} câu hỏi
                {session.quizPassed ? ' • đã đạt' : ''}
              </p>
              <Button type="button" size="sm" disabled={locked} onClick={() => onStartQuiz(session._id)}>
                {session.quizPassed ? 'Làm lại' : 'Bắt đầu luyện tập'}
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="info" className="mt-3 flex flex-col gap-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> ~{session.durationMin} phút
            </span>
            <span>{new Date(session.startAt).toLocaleDateString('vi-VN')}</span>
          </div>
          {(session.objectives?.length ?? 0) > 0 && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">
                Sau chặng này bạn có thể
              </p>
              <ul className="flex flex-col gap-1">
                {session.objectives!.map((o, i) => (
                  <li key={i} className="text-sm text-foreground">
                    • {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {session.theoryContent && (
            <TheoryBlockViewer raw={session.theoryContent} className="rounded-control bg-info/5 p-2" />
          )}
          {session.note && <p className="text-sm text-muted-foreground">Ghi chú: {session.note}</p>}
        </TabsContent>
      </Tabs>
    </aside>
  );
}

/** "Lộ trình của tôi" — a single plan's real sessions (chặng) as a vertical timeline, with a content
 * inspector on the side instead of everything expanded inline (RoadmapTree's zigzag card style,
 * reused by the "Kế hoạch học tập" tab, stays as-is for the schedule-first view). */
export function LearningPathOverview({
  plan,
  goal,
  onStartQuiz,
}: {
  plan: Plan | undefined;
  goal: Goal | undefined;
  onStartQuiz: (sessionId: string) => void;
}) {
  const ordered = useMemo(
    () =>
      [...(plan?.sessions ?? [])].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [plan],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = ordered.find((s) => s._id === selectedId) ?? null;
  const chapters = useMemo(() => {
    const groups: { title: string; sessions: PlanSession[] }[] = [];
    for (const s of ordered) {
      const title = s.chapterTitle || UNGROUPED;
      const last = groups[groups.length - 1];
      if (last && last.title === title) last.sessions.push(s);
      else groups.push({ title, sessions: [s] });
    }
    return groups;
  }, [ordered]);

  if (!plan || ordered.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border text-center">
        <Flag className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Chưa có lộ trình đang hoạt động — đặt mục tiêu và chọn lộ trình mẫu ở tab "Kế hoạch học tập".
        </p>
      </div>
    );
  }

  const doneCount = ordered.filter((s) => s.status === 'done').length;
  const percent = Math.round((doneCount / ordered.length) * 100);
  const totalMin = ordered.reduce((sum, s) => sum + s.durationMin, 0);
  const doneMin = ordered.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.durationMin, 0);
  const nextSession = ordered.find((s) => s.status === 'planned' && s.stageStatus !== 'locked');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-card p-4 shadow-card">
        <div className="flex min-w-[160px] flex-1 items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <span className="shrink-0 text-sm font-bold text-foreground">{percent}%</span>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ListChecks className="h-4 w-4 text-primary" />
          {doneCount}/{ordered.length} chặng
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="h-4 w-4 text-amber-foreground" />
          {Math.round((doneMin / 60) * 10) / 10}h / {Math.round((totalMin / 60) * 10) / 10}h
        </span>
        {goal && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Flag className="h-4 w-4 text-danger" /> Hạn:{' '}
            {new Date(goal.deadline).toLocaleDateString('vi-VN')}
          </span>
        )}
        {goal?.targetScore != null && (
          <span className="flex items-center gap-1.5 rounded-full border border-amber/60 bg-amber/20 px-2.5 py-1 text-xs font-semibold text-amber-foreground">
            <Star className="h-3.5 w-3.5" /> Mục tiêu: ≥ {goal.targetScore}%
          </span>
        )}
      </div>

      {nextSession && (
        <Button type="button" className="w-fit" onClick={() => setSelectedId(nextSession._id)}>
          <PlayCircle className="h-4 w-4" /> Học tiếp: {nextSession.title ?? 'Chặng tiếp theo'}
        </Button>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* "Giáo trình môn học" index — jumps the middle timeline to that chapter's section, real
         * grouping from the plan-template step's chapterTitle, not a fabricated chapter list. */}
        {chapters.length > 1 && (
          <aside className="flex shrink-0 flex-col gap-1 rounded-card border border-border bg-card p-3 shadow-card lg:w-[220px]">
            <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Giáo trình môn học</p>
            {chapters.map((ch, i) => {
              const done = ch.sessions.filter((s) => s.status === 'done').length;
              return (
                <button
                  key={ch.title + i}
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(`chapter-${i}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className="flex items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                >
                  {done === ch.sessions.length ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{ch.title}</span>
                </button>
              );
            })}
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {chapters.map((ch, i) => {
            const doneInChapter = ch.sessions.filter((s) => s.status === 'done').length;
            const chapterMinutes = ch.sessions.reduce((sum, s) => sum + s.durationMin, 0);
            return (
              <div key={ch.title + i} id={`chapter-${i}`} className="flex flex-col gap-2">
                {ch.title !== UNGROUPED && (
                  <div className="flex items-center justify-between gap-2 rounded-control bg-muted/40 px-3 py-2">
                    <p className="text-sm font-bold text-foreground">{ch.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doneInChapter}/{ch.sessions.length} chặng • ~
                      {Math.round((chapterMinutes / 60) * 10) / 10}h
                    </p>
                  </div>
                )}
                {ch.sessions.map((s) => {
                  const locked = s.stageStatus === 'locked';
                  const isSelected = s._id === selectedId;
                  const Icon = locked ? Lock : s.status === 'done' ? CheckCircle2 : BookOpen;
                  return (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => setSelectedId(s._id)}
                      className={cn(
                        'flex items-center gap-3 rounded-card border p-3 text-left transition-colors',
                        isSelected
                          ? 'border-primary bg-primary-soft'
                          : locked
                            ? 'border-border bg-muted/30 opacity-70'
                            : 'border-border bg-card hover:bg-muted/40',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          s.status === 'done'
                            ? 'bg-success text-white'
                            : locked
                              ? 'bg-muted-foreground/60 text-white'
                              : 'bg-primary text-primary-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {s.title ?? 'Chặng học'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.questions?.length ?? 0} câu luyện tập • ~{s.durationMin} phút
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {selected && <StageInspector session={selected} onStartQuiz={onStartQuiz} />}
      </div>
    </div>
  );
}
