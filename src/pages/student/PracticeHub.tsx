import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, BookOpen, Layers, Sparkles, XCircle, Zap } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getCardStateStats } from '@/services/card-state';
import { listWrongItems } from '@/services/wrong-item';
import { listMasteries } from '@/services/mastery';
import { getPriorityQueue } from '@/services/adaptive';
import { startQuickQuiz } from '@/services/assessment';
import type { ApiError } from '@/services/apiError';
import { NextBestActionCard } from './components/NextBestActionCard';
import { AssessmentDialog } from './components/AssessmentDialog';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';

interface ModeCard {
  key: string;
  title: string;
  description: string;
  chip?: string;
  path?: string;
  available: boolean;
}

/** S9 "Luyện tập" hub — the sidebar's "Tổng quan" child (see menu.student.ts) since Sidebar's
 * MenuParent always renders a parent-with-children as a toggle, never a link (layouts/Sidebar.tsx). */
export default function PracticeHubPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { selectedSubjectId } = useSelectedSubject();
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [quickAssessmentId, setQuickAssessmentId] = useState<string | null>(null);

  const { data: cardStats } = useQuery({
    queryKey: ['practice-hub-card-stats', selectedSubjectId ?? 'all'],
    queryFn: () => getCardStateStats(undefined, selectedSubjectId ?? undefined),
  });

  const { data: wrongRes } = useQuery({
    queryKey: ['practice-hub-wrong-open', selectedSubjectId ?? 'all'],
    queryFn: () => listWrongItems({ status: 'open', page: 1, limit: 1, subjectId: selectedSubjectId ?? undefined }),
  });
  const wrongOpenCount = wrongRes?.meta?.total ?? 0;

  const { data: masteryRes } = useQuery({
    queryKey: ['practice-hub-masteries', selectedSubjectId ?? 'all'],
    queryFn: () => listMasteries({ page: 1, limit: 100, subjectId: selectedSubjectId ?? undefined }),
  });
  const needPracticeCount = (masteryRes?.data ?? []).filter((m) => m.level !== 'mastered').length;

  const { data: priorityQueue = [] } = useQuery({
    queryKey: ['practice-hub-priority-queue'],
    queryFn: () => getPriorityQueue(),
  });

  const quickQuizMutation = useMutation({
    mutationFn: () => startQuickQuiz({ count: 5 }),
    onSuccess: (attempt) => setQuickAssessmentId(attempt._id),
    onError: (err) => toast.error((err as ApiError)?.message || 'Chưa có câu hỏi nhanh khả dụng'),
  });

  const modes: Array<ModeCard & { cta: string; icon: typeof BookOpen; tone: string }> = [
    {
      key: 'p1',
      title: 'Luyện theo chương / chủ đề',
      description: 'Ôn tập tập trung từng phần kiến thức đang cần củng cố.',
      chip: `${needPracticeCount} chủ đề`,
      cta: 'Chọn chủ đề',
      icon: BookOpen,
      tone: 'bg-primary/10 text-primary',
      path: PATHS.student.practice,
      available: true,
    },
    {
      key: 'p2',
      title: 'Thẻ ghi nhớ',
      description: 'Ôn thẻ đến hạn hôm nay theo lịch lặp lại ngắt quãng.',
      chip: `${cardStats?.due ?? 0} thẻ`,
      cta: 'Ôn thẻ ngay',
      icon: Layers,
      tone: 'bg-primary/10 text-primary',
      path: PATHS.student.flashcardReview,
      available: true,
    },
    {
      key: 'p3',
      title: 'Làm lại câu sai',
      description: 'Luyện lại đúng các câu bạn đã trả lời sai trước đây.',
      chip: `${wrongOpenCount} câu`,
      cta: 'Sửa câu sai',
      icon: XCircle,
      tone: 'bg-danger/10 text-danger',
      path: PATHS.student.wrongItems,
      available: true,
    },
    {
      key: 'p4',
      title: 'Ôn tập ưu tiên',
      description: 'Hàng đợi kiến thức yếu & gấp xếp hạng theo quy tắc BR-40.',
      chip: `${priorityQueue.length} mục`,
      cta: 'Ôn ưu tiên',
      icon: AlertCircle,
      tone: 'bg-muted text-foreground',
      available: true,
    },
    {
      key: 'p5',
      title: 'Câu hỏi nhanh',
      description: 'Làm nhanh 5 câu trắc nghiệm ngẫu nhiên để kiểm tra phản xạ.',
      chip: '5 câu',
      cta: 'Làm nhanh 5 câu',
      icon: Zap,
      tone: 'bg-primary/10 text-primary',
      available: true,
    },
    {
      key: 'p6',
      title: 'Câu hỏi AI sinh',
      description: 'Tạo câu hỏi luyện tập theo chủ đề bạn chọn để tự kiểm tra.',
      chip: 'AI',
      cta: 'Tạo câu hỏi AI',
      icon: Sparkles,
      tone: 'bg-primary/10 text-primary',
      path: PATHS.student.aiAssist,
      available: true,
    },
  ];

  return (
    <AppShell
      menu={studentMenu}
      title="Luyện tập"
      breadcrumb={['Trang chủ', 'Luyện tập', 'Tổng quan']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Luyện tập</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chọn hình thức ôn tập phù hợp để củng cố kiến thức và khắc phục điểm yếu.
          </p>
        </div>
        <SubjectFilterPill />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <NextBestActionCard />
        <Card className="flex flex-col justify-between rounded-card border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 text-base font-bold text-foreground">Cần xử lý hôm nay</h2>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => navigate(PATHS.student.flashcardReview)}
              className="flex items-center justify-between rounded-control bg-muted/40 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/70"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" />
                </span>
                Thẻ đến hạn hôm nay
              </span>
              <span className="text-base font-bold text-foreground">{cardStats?.due ?? 0}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(PATHS.student.wrongItems)}
              className="flex items-center justify-between rounded-control bg-muted/40 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/70"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger">
                  <XCircle className="h-4 w-4" />
                </span>
                Câu sai chưa khắc phục
              </span>
              <span className="text-base font-bold text-danger">{wrongOpenCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setPriorityOpen(true)}
              className="flex items-center justify-between rounded-control bg-muted/40 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/70"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                  <AlertCircle className="h-4 w-4" />
                </span>
                Mục ôn ưu tiên
              </span>
              <span className="text-base font-bold text-foreground">{priorityQueue.length}</span>
            </button>
          </div>
        </Card>
      </div>

      <h2 className="mb-3 text-base font-bold text-foreground">Chế độ luyện tập</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((m) => {
          const ModeIcon = m.icon;
          const isDanger = m.key === 'p3';
          return (
            <Card
              key={m.key}
              interactive={m.available}
              className="flex flex-col justify-between gap-4 rounded-card border border-border bg-card p-5 shadow-card"
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', m.tone)}>
                    <ModeIcon className="h-4 w-4" />
                  </span>
                  {m.chip && (
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        isDanger ? 'bg-danger/10 text-danger' : 'bg-muted text-foreground',
                      )}
                    >
                      {m.chip}
                    </span>
                  )}
                </div>
                <p className="font-bold text-foreground">{m.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!m.available || (m.key === 'p5' && quickQuizMutation.isPending)}
                className="w-full"
                onClick={() => {
                  if (m.key === 'p4') setPriorityOpen(true);
                  else if (m.key === 'p5') quickQuizMutation.mutate();
                  else if (m.path) navigate(m.path);
                }}
              >
                {m.key === 'p5' && quickQuizMutation.isPending ? 'Đang tạo đề…' : m.cta}
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={priorityOpen} onOpenChange={setPriorityOpen}>
        <DialogContent className="tw-scope max-w-lg">
          <DialogHeader>
            <DialogTitle>Hàng đợi ôn tập ưu tiên (BR-40)</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {priorityQueue.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu ưu tiên — hãy làm một vài bài luyện tập hoặc đặt mục tiêu học tập.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {priorityQueue.map((item, idx) => (
                  <li
                    key={item.concept.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {idx + 1}. {item.concept.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mastery: {item.masteryScore}% · {item.reason}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setPriorityOpen(false);
                        navigate(`${PATHS.student.practice}?concept=${item.concept.id}`);
                      }}
                    >
                      Ôn ngay
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AssessmentDialog
        assessmentId={quickAssessmentId}
        open={!!quickAssessmentId}
        onClose={() => setQuickAssessmentId(null)}
      />
    </AppShell>
  );
}
