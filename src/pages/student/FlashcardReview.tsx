import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Brain, Eye, EyeOff, LogOut } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { cardStateKeys, listDueCards, reviewCard } from '@/services/card-state';
import type { DueCardState, ReviewGrade } from '@/services/card-state/types';
import type { ApiError } from '@/services/apiError';

function previewNextInterval(card: DueCardState | undefined, grade: ReviewGrade): string {
  if (grade === 'again') return 'sẽ hiện lại hôm nay';
  const cur = Math.max(card?.intervalDays ?? 0, 1);
  const ef = card?.easeFactor ?? 2.5;
  if (grade === 'hard') return `${Math.max(1, Math.round(cur * 1.2))} ngày`;
  if (grade === 'good') return `${card?.reps ? Math.max(3, Math.round(cur * ef)) : 3} ngày`;
  return `${card?.reps ? Math.max(7, Math.round(cur * ef * 1.3)) : 7} ngày`;
}

const GRADE_META: Array<{ grade: ReviewGrade; label: string; accent: string }> = [
  { grade: 'again', label: 'Quên', accent: 'border-danger/30 hover:border-danger hover:bg-danger/5' },
  { grade: 'hard', label: 'Khó', accent: 'border-warning/40 hover:border-warning hover:bg-warning/5' },
  { grade: 'good', label: 'Tốt', accent: 'border-primary/30 hover:border-primary hover:bg-primary/5' },
  { grade: 'easy', label: 'Dễ', accent: 'border-success/40 hover:border-success hover:bg-success/5' },
];

export function FlashcardReviewContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedSubjectId } = useSelectedSubject();
  const [queue, setQueue] = useState<DueCardState[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [totalDue, setTotalDue] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: cardStateKeys.due({ subjectId: selectedSubjectId ?? undefined }),
    queryFn: () => listDueCards({ limit: 100, subjectId: selectedSubjectId ?? undefined }),
  });

  useEffect(() => {
    if (data) {
      setQueue(data);
      setTotalDue(data.length);
    }
  }, [data]);

  const current = queue[0];
  const reviewedCount = totalDue - queue.length;
  const newCount = useMemo(() => queue.filter((c) => c.status === 'new').length, [queue]);
  const reviewCount = useMemo(() => queue.filter((c) => c.status !== 'new').length, [queue]);

  const deckTitle = useMemo(() => {
    if (!current?.deck) return 'Ôn tập hôm nay';
    return typeof current.deck === 'string' ? 'Ôn tập hôm nay' : current.deck.title;
  }, [current]);

  const reviewMutation = useMutation({
    mutationFn: (grade: ReviewGrade) => reviewCard(current.card._id, grade),
    onSuccess: () => {
      setQueue((q) => q.slice(1));
      setFlipped(false);
      queryClient.invalidateQueries({ queryKey: cardStateKeys.all });
    },
    onError: (err) => toast.error((err as ApiError).message || 'Không ghi nhận được kết quả ôn thẻ'),
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header row — matches Ảnh 4 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{deckTitle}</h1>
          {current && (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Thẻ {reviewedCount + 1} / {totalDue} · Mới: {newCount} · Ôn: {reviewCount}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SubjectFilterPill />
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Lặp lại ngắt quãng
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(PATHS.student.practiceHub)}>
            <LogOut className="h-3.5 w-3.5" /> Thoát
          </Button>
        </div>
      </div>

      {isLoading && <ListSkeleton rows={3} />}

      {!isLoading && totalDue === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card py-16 text-center">
          <Brain className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Không có thẻ nào đến hạn ôn hôm nay.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(PATHS.student.practiceHub)}>
            Quay lại Luyện tập
          </Button>
        </div>
      )}

      {!isLoading && totalDue > 0 && !current && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-card py-16 text-center shadow-card">
          <Brain className="h-10 w-10 text-success" />
          <p className="text-base font-semibold text-foreground">
            Đã ôn xong {totalDue}/{totalDue} thẻ. Hẹn gặp lại hôm sau!
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(PATHS.student.practiceHub)}>
            Quay lại Luyện tập
          </Button>
        </div>
      )}

      {current && (
        <>
          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.max(4, Math.round(((reviewedCount + 1) / totalDue) * 100))}%` }}
            />
          </div>

          {/* Main Flashcard Box */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setFlipped((f) => !f);
              }
            }}
            className="flex min-h-[280px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-card border border-border bg-card p-8 text-center shadow-card transition-colors hover:bg-muted/20"
          >
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {flipped ? 'Mặt sau · Đáp án' : 'Mặt trước'}
            </span>
            <p className="max-w-2xl text-2xl font-bold leading-snug text-foreground">
              {flipped ? current.card.back : current.card.front}
            </p>
            <span className="text-xs text-muted-foreground">
              Chạm hoặc bấm nút bên dưới để {flipped ? 'quay lại câu hỏi' : 'xem đáp án và đánh giá mức độ ghi nhớ'}.
            </span>
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped((f) => !f);
              }}
            >
              {flipped ? (
                <>
                  <EyeOff className="h-4 w-4" /> Ẩn đáp án
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" /> Hiện đáp án
                </>
              )}
            </Button>
          </div>

          {/* Bottom 4-level SM-2 rating grid */}
          <div className="mt-1 flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">Bạn nhớ thẻ này thế nào?</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {GRADE_META.map(({ grade, label, accent }) => (
                <button
                  key={grade}
                  type="button"
                  disabled={!flipped || reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate(grade)}
                  className={cn(
                    'flex flex-col items-start justify-center gap-1 rounded-card border bg-card px-4 py-3 text-left shadow-sm transition-all',
                    flipped
                      ? `cursor-pointer ${accent}`
                      : 'cursor-not-allowed border-border opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-bold',
                      grade === 'again' ? 'text-danger' : 'text-foreground',
                    )}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {previewNextInterval(current, grade)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function FlashcardReviewPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <AppShell
      menu={studentMenu}
      title="Thẻ ghi nhớ"
      breadcrumb={['Trang chủ', 'Luyện tập', 'Ôn thẻ ghi nhớ']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <FlashcardReviewContent />
    </AppShell>
  );
}
