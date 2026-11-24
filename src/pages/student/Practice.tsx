import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlayCircle } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { ConceptSelect } from '@/components/ConceptSelect';
import { listAssessmentConfigs } from '@/services/assessment-config';
import { startAssessment } from '@/services/assessment';
import { AssessmentDialog } from './components/AssessmentDialog';

// Real gradable practice (BR-45: unlimited retakes unless the config's own retryPolicy caps it) —
// reuses the exact start/take/grade flow already built for "Đánh giá" (startAssessment +
// AssessmentDialog), just scoped to assessment configs of kind 'practice'.
export default function PracticePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const concept = searchParams.get('concept') ?? '';
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['practice-configs', concept],
    queryFn: () =>
      listAssessmentConfigs({ kind: 'practice', status: 'active', concept: concept || undefined, limit: 100 }),
  });
  const configs = data?.data ?? [];

  const startMutation = useMutation({
    mutationFn: (configId: string) => startAssessment(configId),
    onSuccess: (attempt) => setOpenId(attempt._id),
    onError: () => toast.error('Không thể bắt đầu luyện tập — có thể bạn đã làm hết số lần cho phép'),
  });

  return (
    <AppShell
      menu={studentMenu}
      title="Luyện tập"
      breadcrumb={['Trang chủ', 'Luyện tập']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-1 text-xl font-bold text-foreground">Luyện tập</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Làm lại không giới hạn số lần (trừ khi đề có giới hạn riêng). Xem kết quả và lời giải ngay sau khi nộp.
      </p>

      <div className="mb-4 max-w-sm">
        <ConceptSelect
          value={concept}
          onChange={(v) => {
            const next = new URLSearchParams(searchParams);
            if (v) next.set('concept', v);
            else next.delete('concept');
            setSearchParams(next, { replace: true });
          }}
          placeholder="Lọc theo kiến thức (tất cả nếu bỏ trống)"
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}

      {!isLoading && configs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Chưa có đề luyện tập nào khả dụng{concept ? ' cho kiến thức này' : ''}.
        </p>
      )}

      {!isLoading && configs.length > 0 && (
        <div className="flex flex-col gap-2">
          {configs.map((c) => (
            <div
              key={c._id}
              className="flex items-center justify-between gap-3 rounded-card border border-border bg-card p-4 shadow-card"
            >
              <div>
                <p className="font-semibold text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.questions.length} câu · Điểm đạt {c.passScore}%
                  {c.timeLimitMinutes ? ` · ${c.timeLimitMinutes} phút` : ' · Không giới hạn thời gian'}
                  {c.retryPolicy?.maxAttempts ? ` · Tối đa ${c.retryPolicy.maxAttempts} lần` : ' · Làm lại tự do'}
                </p>
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
    </AppShell>
  );
}
