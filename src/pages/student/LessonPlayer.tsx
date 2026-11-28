import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  PlayCircle,
  StickyNote,
  Trash2,
} from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { ThreePanelSkeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import { parseTheoryBlocks } from '@/lib/theoryBlocks';
import { cn } from '@/lib/utils';
import { getPlan, updateSession } from '@/services/planning';
import { planningKeys } from '@/services/planning/queryKeys';
import { accountKeys } from '@/services/account';
import { createConceptNote, deleteConceptNote, listConceptNotes } from '@/services/knowledge';
import type { ApiError } from '@/services/apiError';
import { SessionQuizDialog } from './components/SessionQuizDialog';

/** ST-12 "Trình học bài" — 3-region Lesson Player:
 * Left: Block outline · Center: Theory/Video content · Right: Progress, Quiz CTA & Personal Notes (§14.5.8). */
export default function LessonPlayerPage() {
  const { planId = '', sessionId = '' } = useParams<{ planId: string; sessionId: string }>();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [noteInput, setNoteInput] = useState('');
  const [needReview, setNeedReview] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: planningKeys.plan(planId),
    queryFn: () => getPlan(planId),
    enabled: !!planId,
  });

  const orderedSessions = useMemo(
    () => [...(plan?.sessions ?? [])].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [plan],
  );
  const sessionIdx = orderedSessions.findIndex((s) => s._id === sessionId);
  const session = sessionIdx >= 0 ? orderedSessions[sessionIdx] : undefined;
  const nextSession = sessionIdx >= 0 && sessionIdx + 1 < orderedSessions.length ? orderedSessions[sessionIdx + 1] : undefined;

  const blocks = useMemo(() => parseTheoryBlocks(session?.theoryContent), [session?.theoryContent]);
  const headings = useMemo(
    () =>
      blocks
        .map((b, i) => ({ index: i, title: b.type === 'heading' ? b.content : b.type === 'video' ? 'Video bài giảng' : `Đoạn ${i + 1}`, type: b.type }))
        .filter((b, i) => b.type === 'heading' || b.type === 'video' || i === 0),
    [blocks],
  );

  const conceptId = session?.concept ?? '';
  const { data: notes = [] } = useQuery({
    queryKey: ['lesson-notes', conceptId],
    queryFn: () => listConceptNotes(conceptId),
    enabled: !!conceptId,
  });

  const addNoteMutation = useMutation({
    mutationFn: () => {
      const prefix = needReview ? '[Cần ôn] ' : '';
      return createConceptNote(conceptId, `${prefix}${noteInput.trim()}`);
    },
    onSuccess: () => {
      setNoteInput('');
      setNeedReview(false);
      queryClient.invalidateQueries({ queryKey: ['lesson-notes', conceptId] });
      toast.success('Đã lưu ghi chú bài học');
    },
    onError: (err) => toast.error((err as ApiError)?.message || 'Không lưu được ghi chú'),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteConceptNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lesson-notes', conceptId] }),
  });

  const markDoneMutation = useMutation({
    mutationFn: () => updateSession(planId, sessionId, { status: 'done' }),
    onSuccess: () => {
      toast.success('Đã hoàn thành bài học!');
      queryClient.invalidateQueries({ queryKey: planningKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.streak });
    },
    onError: (err) => toast.error((err as ApiError)?.message || 'Không thể hoàn thành chặng'),
  });

  const hasQuiz = (session?.questions?.length ?? 0) > 0;
  const isDone = session?.status === 'done';

  return (
    <AppShell
      menu={studentMenu}
      title={session?.title ?? 'Trình học bài'}
      breadcrumb={['Trang chủ', 'Lộ trình & kế hoạch', session?.title ?? 'Bài học']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => navigate(PATHS.student.learningRoadmap)}>
          <ArrowLeft className="h-4 w-4" /> Quay lại Lộ trình
        </Button>
        {session && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> ~{session.durationMin} phút
            </span>
            {isDone && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 font-semibold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn thành
              </span>
            )}
          </div>
        )}
      </div>

      {isLoading && <ThreePanelSkeleton />}
      {!isLoading && !session && (
        <div className="rounded-card border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Không tìm thấy bài học này.</p>
        </div>
      )}

      {!isLoading && session && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          {/* Left: Mục lục block */}
          <aside className="rounded-card border border-border bg-card p-3.5 shadow-card lg:col-span-3">
            <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-bold text-foreground">
              <BookOpen className="h-4 w-4 text-primary" /> Mục lục bài học
            </h2>
            {headings.length === 0 ? (
              <p className="text-xs text-muted-foreground">Bài học tổng hợp ngắn gọn.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {headings.map((h, i) => (
                  <li key={h.index}>
                    <button
                      type="button"
                      onClick={() => setActiveBlockIdx(h.index)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
                        activeBlockIdx === h.index
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-foreground hover:bg-muted/60',
                      )}
                    >
                      {h.type === 'video' ? (
                        <PlayCircle className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">
                        {i + 1}. {h.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Center: Nội dung bài học */}
          <section className="rounded-card border border-border bg-card p-5 shadow-card lg:col-span-6">
            {session.chapterTitle && (
              <p className="mb-1 text-xs font-medium text-muted-foreground">{session.chapterTitle}</p>
            )}
            <h1 className="mb-4 text-xl font-bold text-foreground">{session.title || 'Bài học'}</h1>

            {(session.objectives?.length ?? 0) > 0 && (
              <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                <p className="mb-1.5 text-xs font-bold uppercase text-primary">Mục tiêu sau bài học</p>
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
              <p className="py-6 text-sm text-muted-foreground">
                {session.note || 'Chặng này tập trung vào luyện tập câu hỏi và củng cố kiến thức.'}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              {!isDone && hasQuiz && !session.quizPassed && (
                <Button type="button" onClick={() => setQuizOpen(true)}>
                  <ListChecks className="h-4 w-4" /> Làm bài kiểm tra ({session.questions!.length} câu)
                </Button>
              )}
              {!isDone && (!hasQuiz || session.quizPassed) && (
                <Button
                  type="button"
                  disabled={markDoneMutation.isPending}
                  onClick={() => markDoneMutation.mutate()}
                >
                  <CheckCircle2 className="h-4 w-4" /> Hoàn thành bài học
                </Button>
              )}
              {isDone && nextSession && nextSession.stageStatus !== 'locked' && (
                <Button
                  type="button"
                  onClick={() => navigate(PATHS.student.lessonPlayer(planId, nextSession._id))}
                >
                  Bài tiếp theo: {nextSession.title || 'Chặng kế'}
                </Button>
              )}
            </div>
          </section>

          {/* Right: Tiến độ & Ghi chú cá nhân (§14.5.8) */}
          <aside className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 shadow-card lg:col-span-3">
            <div>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
                <StickyNote className="h-4 w-4 text-primary" /> Ghi chú cá nhân
              </h2>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Ghi lại ý chính hoặc thắc mắc…"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={needReview}
                    onChange={(e) => setNeedReview(e.target.checked)}
                  />
                  Đánh dấu "Cần ôn"
                </label>
                <Button
                  type="button"
                  size="sm"
                  disabled={!noteInput.trim() || !conceptId || addNoteMutation.isPending}
                  onClick={() => addNoteMutation.mutate()}
                >
                  Lưu ghi chú
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Ghi chú đã lưu ({notes.length})
              </p>
              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có ghi chú nào cho kiến thức này.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {notes.map((n) => (
                    <li key={n.id} className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 p-2 text-xs">
                      <span className="text-foreground">{n.content}</span>
                      <button
                        type="button"
                        aria-label="Xóa ghi chú"
                        onClick={() => deleteNoteMutation.mutate(n.id)}
                        className="shrink-0 text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}

      {session && (
        <SessionQuizDialog
          planId={planId}
          sessionId={quizOpen ? session._id : null}
          questionIds={session.questions ?? []}
          onClose={() => setQuizOpen(false)}
          onPassed={() => {
            queryClient.invalidateQueries({ queryKey: planningKeys.all });
            queryClient.invalidateQueries({ queryKey: accountKeys.streak });
            setQuizOpen(false);
          }}
        />
      )}
    </AppShell>
  );
}
