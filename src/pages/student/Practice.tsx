import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, PlayCircle } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ConceptSelect } from '@/components/ConceptSelect';
import { listAssessmentConfigs } from '@/services/assessment-config';
import { startAssessment } from '@/services/assessment';
import { AssessmentDialog } from './components/AssessmentDialog';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import type { ApiError } from '@/services/apiError';

// Real gradable practice (BR-45: unlimited retakes unless the config's own retryPolicy caps it) —
// reuses the exact start/take/grade flow already built for "Đánh giá" (startAssessment +
// AssessmentDialog), just scoped to assessment configs of kind 'practice'.
function PracticeQuizContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedSubjectId } = useSelectedSubject();
  const concept = searchParams.get('concept') ?? '';
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['practice-configs', concept, selectedSubjectId ?? 'all'],
    queryFn: () =>
      listAssessmentConfigs({
        kind: 'practice',
        status: 'active',
        concept: concept || undefined,
        subjectId: selectedSubjectId ?? undefined,
        limit: 100,
      }),
  });
  const configs = data?.data ?? [];

  const startMutation = useMutation({
    mutationFn: (configId: string) => startAssessment(configId),
    onSuccess: (attempt) => setOpenId(attempt._id),
    onError: (err) => toast.error((err as ApiError).message || 'Không thể bắt đầu luyện tập — có thể bạn đã làm hết số lần cho phép'),
  });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Trắc nghiệm luyện tập</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Làm lại không giới hạn số lần. Xem kết quả và lời giải chi tiết ngay sau khi nộp.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SubjectFilterPill />
          <div className="w-64">
            <ConceptSelect
              value={concept}
              onChange={(v) => {
                const next = new URLSearchParams(searchParams);
                if (v) next.set('concept', v);
                else next.delete('concept');
                setSearchParams(next, { replace: true });
              }}
              placeholder="Lọc theo kiến thức (tất cả)"
            />
          </div>
          <span className="rounded-control border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
            {configs.length} bộ đề
          </span>
        </div>
      </div>

      {isLoading && <ListSkeleton rows={4} />}

      {!isLoading && configs.length === 0 && (
        <div className="rounded-card border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Chưa có đề luyện tập nào khả dụng{concept ? ' cho kiến thức này' : ''}.
        </div>
      )}

      {!isLoading && configs.length > 0 && (
        <div className="flex flex-col gap-3">
          {configs.map((c) => (
            <div
              key={c._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-foreground">{c.title}</p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      Đạt ≥ {c.passScore}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.questions.length} câu · Điểm đạt {c.passScore}%
                    {c.timeLimitMinutes ? ` · ${c.timeLimitMinutes} phút` : ' · Không giới hạn thời gian'}
                    {c.retryPolicy?.maxAttempts ? ` · Tối đa ${c.retryPolicy.maxAttempts} lần` : ' · Làm lại tự do'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={startMutation.isPending}
                onClick={() => startMutation.mutate(c._id)}
              >
                <PlayCircle className="h-4 w-4" /> Luyện ngay
              </Button>
            </div>
          ))}
        </div>
      )}

      <AssessmentDialog assessmentId={openId} open={!!openId} onClose={() => setOpenId(null)} />
    </>
  );
}

// "Trắc nghiệm" — one of the three "Luyện tập" submenu entries (sidebar children, see
// menu.student.ts), each now its own routed page instead of an in-page tab so the sidebar can
// highlight the one actually active. Sổ câu sai / Ôn thẻ ghi nhớ live in WrongItems.tsx /
// FlashcardReview.tsx and keep their own route + page shell.
export default function PracticePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <AppShell
      menu={studentMenu}
      title="Luyện tập"
      breadcrumb={['Trang chủ', 'Luyện tập', 'Trắc nghiệm']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <PracticeQuizContent />
    </AppShell>
  );
}
