import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  FileText,
  Flag,
  Layers,
  ListChecks,
  Lock,
  Network,
  Play,
  PlayCircle,
  Plus,
  Share2,
  X,
} from 'lucide-react';

import { PATHS } from '@/routes/paths';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import { parseTheoryBlocks } from '@/lib/theoryBlocks';
import { cn } from '@/lib/utils';
import { updateSession } from '@/services/planning';
import { planningKeys } from '@/services/planning/queryKeys';
import type { Plan, PlanSession } from '@/services/planning/types';
import { getConcept } from '@/services/knowledge';
import { getQuestion } from '@/services/question-bank';
import { listMasteries } from '@/services/mastery';
import type { ApiError } from '@/services/apiError';
import { SessionQuizDialog } from './components/SessionQuizDialog';

const DEFAULT_CHAPTER_TITLE = 'Nội dung lộ trình';

function formatDuration(minutes: number) {
  if (minutes <= 0) return '0 phút';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
}

interface ChapterGroup {
  id: string;
  title: string;
  sessions: PlanSession[];
}

interface LessonUnit {
  id: string;
  title: string;
  kind: 'video' | 'doc';
  minutes: number;
}

function deriveLessonUnits(session: PlanSession): LessonUnit[] {
  const blocks = parseTheoryBlocks(session.theoryContent);
  if (blocks.length === 0) {
    return [
      {
        id: `${session._id}-main`,
        title: session.title || 'Nội dung lý thuyết trọng tâm',
        kind: 'doc',
        minutes: Math.max(10, Math.round(session.durationMin * 0.6)),
      },
    ];
  }

  const units: LessonUnit[] = [];
  let currentTitle = session.title || 'Bài học trọng tâm';
  let hasVideo = false;
  let hasDoc = false;

  blocks.forEach((b, idx) => {
    if (b.type === 'heading') {
      if (idx > 0 && (hasVideo || hasDoc)) {
        units.push({
          id: `${session._id}-u-${units.length}`,
          title: currentTitle,
          kind: hasVideo ? 'video' : 'doc',
          minutes: 15,
        });
        hasVideo = false;
        hasDoc = false;
      }
      currentTitle = b.content;
    } else if (b.type === 'video') {
      hasVideo = true;
    } else {
      hasDoc = true;
    }
  });

  if (hasVideo || hasDoc || units.length === 0) {
    units.push({
      id: `${session._id}-u-${units.length}`,
      title: currentTitle,
      kind: hasVideo ? 'video' : 'doc',
      minutes: 15,
    });
  }

  const perUnitMin = Math.max(10, Math.round((session.durationMin * 0.7) / units.length));
  return units.map((u) => ({ ...u, minutes: perUnitMin }));
}

function StageContentTab({
  session,
  chapterIndex,
  stageIndex,
  readSessionIds,
  onOpenReader,
}: {
  session: PlanSession;
  chapterIndex: number;
  stageIndex: number;
  readSessionIds: Set<string>;
  onOpenReader: () => void;
}) {
  const ids = session.questions ?? [];
  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ['roadmap-stage-questions', session._id, ids],
    queryFn: () => Promise.all(ids.map((id) => getQuestion(id))),
    enabled: ids.length > 0,
  });

  const conceptIds = useMemo(
    () => [
      ...new Set(
        (questions ?? [])
          .map((q) => (!q.concept ? null : typeof q.concept === 'string' ? q.concept : q.concept._id))
          .filter((id): id is string => !!id)
          .concat(session.concept ? [session.concept] : []),
      ),
    ],
    [questions, session.concept],
  );

  const { data: concepts } = useQuery({
    queryKey: ['roadmap-stage-concepts', conceptIds],
    queryFn: () => Promise.all(conceptIds.map((id) => getConcept(id))),
    enabled: conceptIds.length > 0,
  });

  const { data: masteryRes } = useQuery({
    queryKey: ['roadmap-stage-mastery'],
    queryFn: () => listMasteries({ limit: 200 }),
    enabled: conceptIds.length > 0,
  });

  const masteredIds = useMemo(() => {
    const set = new Set<string>();
    (masteryRes?.data ?? []).forEach((m) => {
      if ((m.learningState === 'UNDERSTOOD' || m.learningState === 'APPLIED') && m.concept) {
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
        if (!r) return;
        const rId = typeof r === 'string' ? r : r._id;
        const rName = typeof r === 'string' ? r : r.name;
        if (!ownIds.has(rId)) map.set(rId, rName);
      });
    });
    return [...map.entries()];
  }, [concepts, conceptIds]);

  const lessonUnits = useMemo(() => deriveLessonUnits(session), [session]);
  const isDone = session.status === 'done';
  const isLocked = session.stageStatus === 'locked';
  const isRead = isDone || readSessionIds.has(session._id);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {lessonUnits.map((unit, uIdx) => {
          const itemDone = isDone || (isRead && uIdx === 0);
          const itemInProgress = !isDone && !isLocked && !itemDone && uIdx === 0;
          return (
            <li key={unit.id}>
              <button
                type="button"
                disabled={isLocked}
                onClick={onOpenReader}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors',
                  isLocked
                    ? 'cursor-not-allowed border-border/60 bg-muted/30 opacity-60'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-primary/[0.03]',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    unit.kind === 'video' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {unit.kind === 'video' ? <PlayCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    Bài {chapterIndex + 1}.{stageIndex + 1}.{uIdx + 1}: {unit.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {unit.kind === 'video' ? 'Video' : 'Tài liệu'} · {unit.minutes} phút
                  </p>
                </div>
                {itemDone ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                ) : itemInProgress ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {!loadingQuestions && (questions?.length ?? 0) > 0 && (
        <div>
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Chủ đề câu hỏi kiểm tra ({questions!.length} câu)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {[
              ...new Set(
                questions!.map((q) => (typeof q.concept === 'string' ? q.concept : q.concept.name)),
              ),
            ].map((name) => (
              <span
                key={name}
                className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Share2 className="h-3.5 w-3.5" /> Kiến thức liên quan
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {related.map(([id, name]) => {
              const mastered = masteredIds.has(id);
              return (
                <span
                  key={id}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium',
                    mastered
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-border bg-muted/40 text-muted-foreground',
                  )}
                >
                  {name}
                  {mastered ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StageInspectorPanel({
  session,
  chapterIndex,
  stageIndex,
  readSessionIds,
  onToggleBookmark,
  isBookmarking,
  onOpenReader,
  onStartQuiz,
  onMarkDone,
  isMarkingDone,
  onClose,
}: {
  session: PlanSession;
  chapterIndex: number;
  stageIndex: number;
  readSessionIds: Set<string>;
  onToggleBookmark: (sessionId: string, next: boolean) => void;
  isBookmarking: boolean;
  onOpenReader: () => void;
  onStartQuiz: (sessionId: string) => void;
  onMarkDone: (sessionId: string) => void;
  isMarkingDone: boolean;
  onClose: () => void;
}) {
  const isLocked = session.stageStatus === 'locked';
  const isDone = session.status === 'done';
  const hasQuiz = (session.questions?.length ?? 0) > 0;
  const isBookmarked = !!session.bookmarked;
  const lessonUnits = useMemo(() => deriveLessonUnits(session), [session]);
  const primaryUnit = lessonUnits[0];

  const ctaLabel = useMemo(() => {
    if (isLocked) return 'Chặng đang khóa';
    if (isDone) return 'Ôn tập lại chặng này';
    if (hasQuiz && !session.quizPassed && readSessionIds.has(session._id)) {
      return 'Làm bài luyện tập';
    }
    if (primaryUnit) {
      return `Học tiếp: Bài ${chapterIndex + 1}.${stageIndex + 1}.1`;
    }
    return 'Hoàn thành chặng';
  }, [isLocked, isDone, hasQuiz, session.quizPassed, session._id, readSessionIds, primaryUnit, chapterIndex, stageIndex]);

  const handlePrimaryCta = () => {
    if (isLocked) return;
    if (isDone) {
      onOpenReader();
      return;
    }
    if (hasQuiz && !session.quizPassed && readSessionIds.has(session._id)) {
      onStartQuiz(session._id);
      return;
    }
    if (session.theoryContent || lessonUnits.length > 0) {
      onOpenReader();
      return;
    }
    if (hasQuiz && !session.quizPassed) {
      onStartQuiz(session._id);
      return;
    }
    onMarkDone(session._id);
  };

  return (
    <aside className="flex h-full flex-col rounded-card border border-border bg-card shadow-card">
      {/* Inspector Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border p-4">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Chặng {chapterIndex + 1}.{stageIndex + 1}
            </p>
            <h3 className="text-sm font-bold leading-snug text-foreground">
              {session.title || 'Chặng học'}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chi tiết chặng"
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLocked && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Cần hoàn thành chặng trước để mở khóa nội dung này.
        </div>
      )}

      {/* Inspector Tabs */}
      <div className="flex-1 p-4">
        <Tabs defaultValue="content">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content" className="text-xs">
              Nội dung học
            </TabsTrigger>
            <TabsTrigger value="practice" className="text-xs">
              Luyện tập
            </TabsTrigger>
            <TabsTrigger value="info" className="text-xs">
              Thông tin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-3">
            <StageContentTab
              session={session}
              chapterIndex={chapterIndex}
              stageIndex={stageIndex}
              readSessionIds={readSessionIds}
              onOpenReader={onOpenReader}
            />
          </TabsContent>

          <TabsContent value="practice" className="mt-3">
            {!hasQuiz ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ListChecks className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Chặng này chưa có bài luyện tập.</p>
                {!isDone && !isLocked && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isMarkingDone}
                    onClick={() => onMarkDone(session._id)}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Đánh dấu hoàn thành
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-5 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ListChecks className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Bài kiểm tra kiến thức chặng
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {session.questions!.length} câu hỏi ·{' '}
                    {session.quizPassed ? 'Đã đạt (≥ 70%)' : 'Cần đạt ≥ 70% để hoàn thành chặng'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isLocked}
                  onClick={() => onStartQuiz(session._id)}
                >
                  {session.quizPassed ? 'Làm lại bài kiểm tra' : 'Bắt đầu luyện tập'}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Ước tính ~{session.durationMin} phút
              </span>
              <span>Ngày dự kiến: {new Date(session.startAt).toLocaleDateString('vi-VN')}</span>
            </div>

            {(session.objectives?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Sau chặng này bạn có thể
                </p>
                <ul className="flex flex-col gap-1.5">
                  {session.objectives!.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {session.note && (
              <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                <strong className="text-foreground">Ghi chú: </strong>
                {session.note}
              </div>
            )}

            {session.theoryContent && (
              <TheoryBlockViewer raw={session.theoryContent} className="rounded-lg bg-info/5 p-3" />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Inspector Sticky CTA Footer */}
      <div className="flex items-center gap-2 border-t border-border p-4">
        <Button
          type="button"
          className="flex-1 gap-2"
          disabled={isLocked || isMarkingDone}
          onClick={handlePrimaryCta}
        >
          <Play className="h-4 w-4 fill-current" />
          <span className="truncate">{ctaLabel}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Đánh dấu chặng"
          disabled={isBookmarking}
          onClick={() => onToggleBookmark(session._id, !isBookmarked)}
          className={cn(isBookmarked && 'border-amber-400 bg-amber-50 text-amber-600')}
        >
          <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
        </Button>
      </div>
    </aside>
  );
}

function TheoryReaderDialog({
  planId,
  session,
  open,
  onClose,
  onMarkRead,
  onStartQuiz,
  onMarkDone,
}: {
  planId: string;
  session: PlanSession | null;
  open: boolean;
  onClose: () => void;
  onMarkRead: (sessionId: string) => void;
  onStartQuiz: (sessionId: string) => void;
  onMarkDone: (sessionId: string) => void;
}) {
  const navigate = useNavigate();
  if (!session) return null;
  const hasQuiz = (session.questions?.length ?? 0) > 0;
  const isDone = session.status === 'done';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="lg" className="tw-scope flex max-h-[85vh] flex-col">
        <DialogHeader>
          <DialogTitle>{session.title || 'Nội dung bài học'}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex-1 overflow-y-auto">
          {(session.objectives?.length ?? 0) > 0 && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1.5 text-xs font-bold uppercase text-primary">Mục tiêu chặng</p>
              <ul className="flex flex-col gap-1">
                {session.objectives!.map((obj, idx) => (
                  <li key={idx} className="text-sm text-foreground">
                    • {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {session.theoryContent ? (
            <TheoryBlockViewer raw={session.theoryContent} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {session.note || 'Chặng này tập trung vào luyện tập câu hỏi và củng cố kiến thức.'}
            </p>
          )}
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onClose();
              navigate(PATHS.student.lessonPlayer(planId, session._id));
            }}
          >
            Mở trình học bài đầy đủ
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {!isDone && hasQuiz && !session.quizPassed && (
            <Button
              type="button"
              onClick={() => {
                onMarkRead(session._id);
                onClose();
                onStartQuiz(session._id);
              }}
            >
              <ListChecks className="h-4 w-4" /> Chuyển sang luyện tập ({session.questions!.length} câu)
            </Button>
          )}
          {!isDone && (!hasQuiz || session.quizPassed) && (
            <Button
              type="button"
              onClick={() => {
                onMarkRead(session._id);
                onMarkDone(session._id);
                onClose();
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Hoàn thành chặng
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LearningRoadmapPage() {
  return <Navigate to={PATHS.student.planner} replace />;
}

export function RoadmapStagesSection({
  activePlan,
  onOpenTree,
  onCreateRoadmap,
}: {
  activePlan?: Plan;
  onOpenTree?: (plan: Plan) => void;
  onCreateRoadmap?: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [chapterCollapsed, setChapterCollapsed] = useState(false);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [readerSessionId, setReaderSessionId] = useState<string | null>(null);
  const [readSessionIds, setReadSessionIds] = useState<Set<string>>(new Set());

  const orderedSessions = useMemo(
    () =>
      [...(activePlan?.sessions ?? [])].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [activePlan],
  );

  const chapters: ChapterGroup[] = useMemo(() => {
    const groups: ChapterGroup[] = [];
    for (const s of orderedSessions) {
      const title = s.chapterTitle?.trim() || DEFAULT_CHAPTER_TITLE;
      const last = groups[groups.length - 1];
      if (last && last.title === title) {
        last.sessions.push(s);
      } else {
        groups.push({ id: `ch-${groups.length}-${title}`, title, sessions: [s] });
      }
    }
    return groups;
  }, [orderedSessions]);

  // Keep selectedChapterId valid when plan/chapters change
  useEffect(() => {
    if (chapters.length === 0) {
      setSelectedChapterId(null);
      return;
    }
    if (!selectedChapterId || !chapters.some((c) => c.id === selectedChapterId)) {
      const activeChapter =
        chapters.find((c) => c.sessions.some((s) => s.status === 'planned' && s.stageStatus !== 'locked')) ??
        chapters[0];
      setSelectedChapterId(activeChapter.id);
    }
  }, [chapters, selectedChapterId]);

  const activeChapterIndex = Math.max(
    0,
    chapters.findIndex((c) => c.id === selectedChapterId),
  );
  const activeChapter = chapters[activeChapterIndex];

  // Keep selectedSessionId synced with activeChapter
  useEffect(() => {
    if (!activeChapter || activeChapter.sessions.length === 0) {
      setSelectedSessionId(null);
      return;
    }
    if (!selectedSessionId || !activeChapter.sessions.some((s) => s._id === selectedSessionId)) {
      const next =
        activeChapter.sessions.find((s) => s.status === 'planned' && s.stageStatus !== 'locked') ??
        activeChapter.sessions[0];
      setSelectedSessionId(next._id);
    }
  }, [activeChapter, selectedSessionId]);

  const selectedStageIndex = activeChapter
    ? Math.max(
        0,
        activeChapter.sessions.findIndex((s) => s._id === selectedSessionId),
      )
    : 0;
  const selectedSession = activeChapter?.sessions[selectedStageIndex] ?? null;

  const markDoneMutation = useMutation({
    mutationFn: (sessionId: string) => {
      if (!activePlan) throw new Error('No active plan');
      return updateSession(activePlan._id, sessionId, { status: 'done' });
    },
    onSuccess: () => {
      toast.success('Đã hoàn thành chặng học!');
      queryClient.invalidateQueries({ queryKey: planningKeys.all });
    },
    onError: (err) => {
      toast.error((err as ApiError).message || 'Không thể cập nhật trạng thái chặng');
    },
  });

  const handleSelectChapter = (ch: ChapterGroup) => {
    setSelectedChapterId(ch.id);
    const nextInCh =
      ch.sessions.find((s) => s.status === 'planned' && s.stageStatus !== 'locked') ?? ch.sessions[0];
    if (nextInCh) {
      setSelectedSessionId(nextInCh._id);
      setInspectorOpen(true);
    }
  };

  const bookmarkMutation = useMutation({
    mutationFn: ({ sessionId, bookmarked }: { sessionId: string; bookmarked: boolean }) => {
      if (!activePlan) throw new Error('No active plan');
      return updateSession(activePlan._id, sessionId, { bookmarked });
    },
    onSuccess: (_plan, vars) => {
      toast.success(vars.bookmarked ? 'Đã đánh dấu chặng để xem lại' : 'Đã bỏ đánh dấu chặng');
      queryClient.invalidateQueries({ queryKey: planningKeys.all });
    },
    onError: (err) => {
      toast.error((err as ApiError).message || 'Không thể cập nhật đánh dấu chặng');
    },
  });

  const handleToggleBookmark = (sessionId: string, next: boolean) => {
    bookmarkMutation.mutate({ sessionId, bookmarked: next });
  };

  const topicCount = useMemo(
    () => new Set(orderedSessions.map((s) => s.concept)).size || orderedSessions.length,
    [orderedSessions],
  );
  const readerSession = orderedSessions.find((s) => s._id === readerSessionId) ?? null;

  return (
    <section className="flex flex-col gap-3.5">
      {/* Header row matching "Lộ trình từng chặng" */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Lộ trình từng chặng</h2>
          <p className="text-xs text-muted-foreground">
            Chọn chương học để xem các chặng và bắt đầu học ngay.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activePlan && onOpenTree && (
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenTree(activePlan)}>
              <Network className="h-3.5 w-3.5 text-primary" /> Xem sơ đồ cây
            </Button>
          )}
          {onCreateRoadmap && (
            <Button type="button" variant="outline" size="sm" onClick={onCreateRoadmap}>
              <Plus className="h-3.5 w-3.5" /> Tạo lộ trình mới
            </Button>
          )}
        </div>
      </div>

      {(!activePlan || orderedSessions.length === 0) && (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Flag className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground">Chưa có lộ trình từng chặng cho mục tiêu này</h3>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              Hãy bấm “AI đề xuất” hoặc “Tự thiết kế” ở mục tiêu phía trên để tạo các chặng học chi tiết.
            </p>
          </div>
        </div>
      )}

      {activePlan && orderedSessions.length > 0 && (
        <div className="flex flex-col gap-4">

          {/* 3-Panel Layout (Wireframe S8) */}
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            {/* PANEL 1: Giáo trình môn học (Chapter Tree) */}
            <section className="flex h-full flex-col rounded-card border border-border bg-card p-3.5 shadow-card lg:col-span-3">
              <div className="mb-3 px-1">
                <h2 className="text-sm font-bold text-foreground">Giáo trình môn học</h2>
                <p className="text-xs text-muted-foreground">
                  {chapters.length} chương · {topicCount} chủ đề
                </p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {chapters.map((ch, idx) => {
                  const isActive = ch.id === activeChapter?.id;
                  const allDone = ch.sessions.every((s) => s.status === 'done');
                  return (
                    <li key={ch.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectChapter(ch)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left text-sm transition-colors',
                          isActive
                            ? 'border-primary/30 bg-primary/10 font-semibold text-primary'
                            : 'border-transparent text-foreground hover:bg-muted/60',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : allDone
                                ? 'bg-success/15 text-success'
                                : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {idx + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{ch.title}</span>
                        {allDone && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* PANEL 2: Dòng tiến trình Chặng (Stages Timeline) */}
            <section
              className={cn(
                'flex h-full flex-col rounded-card border border-border bg-card p-4 shadow-card',
                inspectorOpen && selectedSession ? 'lg:col-span-5' : 'lg:col-span-9',
              )}
            >
              {activeChapter && (
                <>
                  {/* Chapter Header */}
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Layers className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-foreground">
                          Chương {activeChapterIndex + 1}: {activeChapter.title}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {activeChapter.sessions.length} chặng học · ước tính{' '}
                          {formatDuration(
                            activeChapter.sessions.reduce((sum, s) => sum + s.durationMin, 0),
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {activeChapter.sessions.every((s) => s.status === 'done') ? (
                        <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                          Hoàn thành
                        </span>
                      ) : activeChapter.sessions.every((s) => s.stageStatus === 'locked') ? (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                          Đang khóa
                        </span>
                      ) : (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          Đang học
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setChapterCollapsed((v) => !v)}
                        aria-label="Thu gọn hoặc mở rộng chương"
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                      >
                        {chapterCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stages Vertical Timeline */}
                  {!chapterCollapsed && (
                    <div className="relative pl-8">
                      {/* Continuous vertical connector */}
                      <div
                        aria-hidden
                        className="absolute bottom-4 left-[13px] top-4 w-0.5 bg-border"
                      />

                      <div className="flex flex-col gap-3.5">
                        {activeChapter.sessions.map((s, sIdx) => {
                          const isDone = s.status === 'done';
                          const isLocked = s.stageStatus === 'locked';
                          const isSelected = s._id === selectedSession?._id;
                          const lessonUnits = deriveLessonUnits(s);
                          const quizCount = (s.questions?.length ?? 0) > 0 ? 1 : 0;
                          const progressPct = isDone
                            ? 100
                            : readSessionIds.has(s._id) || s.quizPassed
                              ? 50
                              : 0;

                          return (
                            <div key={s._id} className="relative">
                              {/* Timeline Node */}
                              <span
                                className={cn(
                                  'absolute -left-8 top-5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-card',
                                  isDone
                                    ? 'bg-success text-white'
                                    : isLocked
                                      ? 'bg-muted text-muted-foreground'
                                      : 'bg-primary text-primary-foreground',
                                )}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : isLocked ? (
                                  <Lock className="h-3.5 w-3.5" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                )}
                              </span>

                              {/* Stage Card */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSessionId(s._id);
                                  setInspectorOpen(true);
                                }}
                                className={cn(
                                  'w-full rounded-xl border p-3.5 text-left transition-all',
                                  isSelected
                                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/15'
                                    : isDone
                                      ? 'border-success/30 bg-success/[0.03] hover:border-success/50'
                                      : isLocked
                                        ? 'border-border bg-muted/20 opacity-75 hover:opacity-100'
                                        : 'border-border bg-card hover:border-primary/40',
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-bold text-foreground">
                                    Chặng {activeChapterIndex + 1}.{sIdx + 1}: {s.title || 'Chặng học'}
                                  </p>
                                  {isDone ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                                      Đã hoàn thành <CheckCircle2 className="h-3 w-3" />
                                    </span>
                                  ) : isLocked ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                      Đang khóa
                                    </span>
                                  ) : (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                      Đang học <Play className="h-2.5 w-2.5 fill-current" />
                                    </span>
                                  )}
                                </div>

                                {(s.note || s.objectives?.[0]) && (
                                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                    {s.note || s.objectives?.[0]}
                                  </p>
                                )}

                                {/* Stage Metrics */}
                                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    {lessonUnits.length} bài học
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <ListChecks className="h-3.5 w-3.5" />
                                    {quizCount} bài luyện tập
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    ~{s.durationMin} phút
                                  </span>
                                </div>

                                {/* Stage Progress Bar when active */}
                                {!isLocked && !isDone && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${progressPct}%` }}
                                      />
                                    </div>
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                      {progressPct}%
                                    </span>
                                  </div>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* PANEL 3: Stage Inspector */}
            {inspectorOpen && selectedSession && (
              <div className="flex flex-col lg:col-span-4">
                <StageInspectorPanel
                  session={selectedSession}
                  chapterIndex={activeChapterIndex}
                  stageIndex={selectedStageIndex}
                  readSessionIds={readSessionIds}
                  onToggleBookmark={handleToggleBookmark}
                  isBookmarking={bookmarkMutation.isPending}
                  onOpenReader={() => setReaderSessionId(selectedSession._id)}
                  onStartQuiz={(id) => setQuizSessionId(id)}
                  onMarkDone={(id) => markDoneMutation.mutate(id)}
                  isMarkingDone={markDoneMutation.isPending}
                  onClose={() => setInspectorOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theory Reader Modal */}
      <TheoryReaderDialog
        planId={activePlan?._id ?? ''}
        session={readerSession}
        open={!!readerSessionId}
        onClose={() => setReaderSessionId(null)}
        onMarkRead={(id) => setReadSessionIds((prev) => new Set(prev).add(id))}
        onStartQuiz={(id) => setQuizSessionId(id)}
        onMarkDone={(id) => markDoneMutation.mutate(id)}
      />

      {/* Quiz Gate Modal */}
      {activePlan && (
        <SessionQuizDialog
          planId={activePlan._id}
          sessionId={quizSessionId}
          questionIds={
            activePlan.sessions.find((s) => s._id === quizSessionId)?.questions ?? []
          }
          onClose={() => setQuizSessionId(null)}
          onPassed={() => {
            queryClient.invalidateQueries({ queryKey: planningKeys.all });
            setQuizSessionId(null);
          }}
        />
      )}
    </section>
  );
}
