import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Clock3, TrendingDown } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import type { ApiError } from '@/services/apiError';
import { dismissRiskWarning, listRiskWarnings } from '@/services/risk';
import { riskWarningKeys } from '@/services/risk/queryKeys';
import type { RiskSeverity, RiskWarning, RiskWarningType } from '@/services/risk/types';
import { replan } from '@/services/adaptive';

const SEVERITY_LABEL: Record<RiskSeverity, string> = { cao: 'Cao', trung_binh: 'Trung bình', thap: 'Thấp' };
const SEVERITY_VARIANT: Record<RiskSeverity, 'danger' | 'warning' | 'neutral'> = {
  cao: 'danger',
  trung_binh: 'warning',
  thap: 'neutral',
};
const TYPE_ICON: Record<RiskWarningType, typeof AlertTriangle> = {
  schedule: AlertTriangle,
  mastery: TrendingDown,
  decay: Clock3,
};

export default function StudentRiskWarningsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: warnings = [], isLoading } = useQuery({
    queryKey: riskWarningKeys.list(),
    queryFn: listRiskWarnings,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: riskWarningKeys.all });

  const replanMutation = useMutation({
    mutationFn: (planId: string) => replan(planId),
    onSuccess: ({ reason }) => {
      toast.success(`Đã đề xuất xếp lại lịch — ${reason}`);
      invalidate();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Xếp lại lịch thất bại'),
  });

  const dismissMutation = useMutation({
    mutationFn: dismissRiskWarning,
    onSuccess: (_data, { action }) => {
      toast.success(action === 'snooze' ? 'Sẽ nhắc lại sau' : 'Đã giữ nguyên lộ trình');
      invalidate();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Thao tác thất bại'),
  });

  return (
    <AppShell
      menu={studentMenu}
      title="Cảnh báo rủi ro"
      breadcrumb={['Trang chủ', 'Cảnh báo rủi ro']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Cảnh báo rủi ro</h1>
        <p className="text-sm text-muted-foreground">
          Hệ thống tự phát hiện rủi ro trễ hạn, mastery yếu và nguy cơ quên kiến thức dựa trên ngưỡng Admin
          cấu hình, kèm lý do và hành động đề xuất. Bạn chọn hành động — lộ trình không tự động thay đổi.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải…</p>}

      {!isLoading && warnings.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Chưa có cảnh báo rủi ro nào — mọi mục tiêu đang bám sát kế hoạch.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {warnings.map((w: RiskWarning) => {
          const Icon = TYPE_ICON[w.type];
          return (
            <Card key={w.key} className="flex flex-col gap-2.5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  <p className="font-semibold text-foreground">{w.title}</p>
                </div>
                <StatusBadge variant={SEVERITY_VARIANT[w.severity]}>{SEVERITY_LABEL[w.severity]}</StatusBadge>
              </div>
              <p className="pl-7 text-sm text-muted-foreground">{w.reason}</p>
              {w.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-7">
                  {w.actions.includes('replan') && w.planId && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={replanMutation.isPending}
                      onClick={() => replanMutation.mutate(w.planId!)}
                    >
                      Điều chỉnh lộ trình
                    </Button>
                  )}
                  {w.actions.includes('keep') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={dismissMutation.isPending}
                      onClick={() => dismissMutation.mutate({ key: w.key, action: 'keep' })}
                    >
                      Giữ nguyên
                    </Button>
                  )}
                  {w.actions.includes('snooze') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={dismissMutation.isPending}
                      onClick={() => dismissMutation.mutate({ key: w.key, action: 'snooze' })}
                    >
                      Nhắc tôi sau
                    </Button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
