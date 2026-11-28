import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Clock, ListChecks, TrendingUp, XCircle } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAssessment, startRetryWrongItems } from '@/services/assessment';
import type { ApiError } from '@/services/apiError';
import { NextBestActionCard } from './components/NextBestActionCard';
import { AssessmentDialog } from './components/AssessmentDialog';
import { ExamReadinessCard, useExamReadiness } from './components/ExamReadinessCard';

/** S12 "Kết quả luyện tập" — a dedicated screen opened from AssessmentDialog's inline result
 * ("Xem kết quả chi tiết" button) once an attempt is submitted. Everything here is real data from
 * this specific attempt / the student's own records — nothing invented. */
export default function PracticeResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [retryOpenId, setRetryOpenId] = useState<string | null>(null);

  const { data: attempt, isLoading } = useQuery({
    queryKey: ['practice-result-attempt', attemptId],
    queryFn: () => getAssessment(attemptId as string),
    enabled: !!attemptId,
  });

  // "Mức sẵn sàng thi" (doc §6.4): ba chỉ số tách biệt, KHÔNG gộp thành một "điểm dự kiến" — khác
  // với chữ mockup trên wireframe S12. Shared with Mastery.tsx (N4) — see ExamReadinessCard.
  const readiness = useExamReadiness();

  const retryMutation = useMutation({
    mutationFn: (concept: string) => startRetryWrongItems(concept),
    onSuccess: (a) => setRetryOpenId(a._id),
    onError: (err) => toast.error((err as ApiError).message || 'Không thể bắt đầu luyện lại'),
  });

  const correctCount = attempt?.answers.filter((a) => a.isCorrect).length ?? 0;
  const total = attempt?.answers.length ?? 0;
  const durationMin =
    attempt?.submittedAt && attempt?.startedAt
      ? Math.max(
          0,
          Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000),
        )
      : null;

  const byTopic = useMemo(() => {
    const map = new Map<string, { name: string; correct: number; total: number }>();
    (attempt?.answers ?? []).forEach((a) => {
      const key = a.conceptId ?? 'unknown';
      const name = a.conceptName ?? 'Không rõ chủ đề';
      const row = map.get(key) ?? { name, correct: 0, total: 0 };
      row.total += 1;
      if (a.isCorrect) row.correct += 1;
      map.set(key, row);
    });
    return [...map.values()];
  }, [attempt]);

  return (
    <AppShell
      menu={studentMenu}
      title="Luyện tập"
      breadcrumb={['Trang chủ', 'Luyện tập', 'Kết quả']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Kết quả luyện tập</h1>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}

      {attempt && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={CheckCircle2}
              tone="mint"
              label="Số câu đúng"
              value={correctCount}
              suffix={`/${total}`}
            />
            <StatCard icon={Clock} tone="blue" label="Thời gian" value={durationMin ?? 0} suffix=" phút" />
            <Card className="relative overflow-hidden rounded-card border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-foreground">Mastery (đo được)</span>
              </div>
              {attempt.masteryBefore != null && attempt.masteryAfter != null ? (
                <div className="mt-2 text-2xl font-bold leading-tight text-foreground">
                  {attempt.masteryBefore}% <span className="text-muted-foreground">→</span> {attempt.masteryAfter}%
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">Chưa có dữ liệu cho lần làm này</div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="rounded-card border border-border bg-card p-4 shadow-card">
              <h2 className="mb-3 font-semibold text-foreground">Theo chủ đề</h2>
              {byTopic.length === 0 ? (
                <p className="text-sm text-muted-foreground">Không có dữ liệu câu hỏi.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-1.5 font-medium">Chủ đề</th>
                      <th className="py-1.5 font-medium">Đúng</th>
                      <th className="py-1.5 font-medium">Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byTopic.map((row) => (
                      <tr key={row.name} className="border-b border-border/60 last:border-0">
                        <td className="py-1.5 text-foreground">{row.name}</td>
                        <td className="py-1.5 text-foreground">
                          {row.correct}/{row.total}
                        </td>
                        <td className="py-1.5 text-foreground">{Math.round((row.correct / row.total) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="rounded-card border border-border bg-card p-4 shadow-card">
                <h2 className="mb-3 font-semibold text-foreground">Gợi ý tiếp theo</h2>
                <NextBestActionCard />
              </Card>

              <ExamReadinessCard {...readiness} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`${PATHS.student.wrongItems}?concept=${attempt.concept}`)}
            >
              <XCircle className="h-4 w-4" /> Xem câu sai
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={retryMutation.isPending}
              onClick={() => retryMutation.mutate(attempt.concept)}
            >
              <ListChecks className="h-4 w-4" /> Làm lại câu sai
            </Button>
            <Button type="button" onClick={() => navigate(PATHS.student.today)}>
              Về Hôm nay
            </Button>
          </div>
        </>
      )}

      <AssessmentDialog assessmentId={retryOpenId} open={!!retryOpenId} onClose={() => setRetryOpenId(null)} />
    </AppShell>
  );
}
