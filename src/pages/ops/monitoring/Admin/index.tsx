import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, Bot, Database, Flag, RefreshCw } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { StatCard } from '@/components/StatCard';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import type { ApiError } from '@/services/apiError';
import { getAiAssistAdminOverview } from '@/services/ai-assist';
import type { AiAssistAdminOverview } from '@/services/ai-assist/types';

const KIND_LABEL: Record<string, string> = {
  generate_question: 'Sinh câu hỏi (admin)',
  practice_question: 'Sinh câu hỏi luyện tập',
  grade_essay: 'Chấm tự luận',
  essay_feedback: 'Nhận xét tự luận',
  qa: 'Hỏi đáp',
  explain_wrong: 'Giải thích câu sai',
  generate_plan: 'Sinh lộ trình học',
  generate_concept: 'Sinh khái niệm kiến thức',
  generate_template: 'Sinh lộ trình mẫu',
};

function formatUptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} giờ ${m} phút`;
  return `${m} phút`;
}

export default function AdminMonitoringItemsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [overview, setOverview] = useState<AiAssistAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await getAiAssistAdminOverview());
    } catch (err) {
      toast.error((err as ApiError)?.message || 'Không thể tải dữ liệu giám sát');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      menu={adminMenu}
      title="Giám sát"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Giám sát']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Giám sát</h1>
          <p className="text-sm text-muted-foreground">
            Dữ liệu thực từ nhật ký yêu cầu AI và tình trạng hệ thống — không có hàng đợi tác vụ nền hay
            biểu đồ tải vì hệ thống hiện chưa có các thành phần đó.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Làm mới
        </Button>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Bot}
          label="Yêu cầu AI (24h)"
          value={overview?.aiRequests.totalLast24h ?? 0}
          tone="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="AI sinh không hợp lệ (24h)"
          value={overview?.aiRequests.invalidLast24h ?? 0}
          tone="amber"
        />
        <StatCard
          icon={Flag}
          label="Bị người học báo lỗi (24h)"
          value={overview?.aiRequests.reportedLast24h ?? 0}
          tone="blush"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Yêu cầu AI gần đây</CardTitle>
          {!overview || overview.aiRequests.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loading ? 'Đang tải...' : 'Chưa có yêu cầu AI nào'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-2 pr-2">Loại</th>
                    <th className="py-2 pr-2">Người yêu cầu</th>
                    <th className="py-2 pr-2">Trạng thái</th>
                    <th className="py-2">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.aiRequests.recent.map((item) => (
                    <tr key={item._id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-2">{KIND_LABEL[item.kind] ?? item.kind}</td>
                      <td className="py-2 pr-2 text-muted-foreground">
                        {item.owner?.fullName || item.owner?.email || '—'}
                      </td>
                      <td className="py-2 pr-2">
                        {item.reported ? (
                          <StatusBadge variant="danger">Bị báo lỗi</StatusBadge>
                        ) : item.valid ? (
                          <StatusBadge variant="success">Hợp lệ</StatusBadge>
                        ) : (
                          <StatusBadge variant="warning">Không hợp lệ</StatusBadge>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Tình trạng hệ thống</CardTitle>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" /> Cơ sở dữ liệu
              </span>
              {overview ? (
                <StatusBadge variant={overview.health.dbConnected ? 'success' : 'danger'}>
                  {overview.health.dbConnected ? 'Đã kết nối' : `Mất kết nối (${overview.health.dbState})`}
                </StatusBadge>
              ) : (
                '—'
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Thời gian hoạt động (uptime)</span>
              <span className="font-medium text-foreground">
                {overview ? formatUptime(overview.health.uptimeSec) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Giới hạn truy cập ({overview?.rateLimit.scope})</span>
              <span className="font-medium text-foreground">
                {overview
                  ? `Tối đa ${overview.rateLimit.max} lần / ${Math.round(overview.rateLimit.windowMs / 60000)} phút`
                  : '—'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
