import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { GitCompareArrows, History } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { compareAttempts, getScoreHistory, listAssessments, startRetryWrong } from '@/services/assessment';
import type { Assessment } from '@/services/assessment/types';
import { AssessmentDialog } from './components/AssessmentDialog';

const mockUser = { name: 'Minh Anh' };

// UC-ASM-06: score before/after a regrade (business-rule: regrade appends a new history entry
// rather than overwriting the original score, so the full before/after trail is preserved).
function ScoreHistoryDialog({ assessmentId, onClose }: { assessmentId: string | null; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['assessment-score-history', assessmentId],
    queryFn: () => getScoreHistory(assessmentId as string),
    enabled: !!assessmentId,
  });

  return (
    <Dialog open={!!assessmentId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="tw-scope max-w-sm">
        <DialogHeader>
          <DialogTitle>Điểm trước và sau khi chấm lại</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          {(data ?? []).map((h, i) => (
            <div key={i} className="flex items-center justify-between rounded-control bg-muted px-3 py-2 text-sm">
              <span>{h.reason === 'regrade' ? 'Sau chấm lại' : 'Chấm lần đầu'}</span>
              <span className="font-semibold">{h.score}%</span>
            </div>
          ))}
          {data?.length === 1 && <p className="text-xs text-muted-foreground">Bài làm chưa được chấm lại lần nào.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [concept, setConcept] = useState<string | null>(null);

  const { data: submitted } = useQuery({
    queryKey: ['assessment-submitted-for-compare'],
    queryFn: () => listAssessments({ status: 'submitted', page: 1, limit: 100 }),
    enabled: open,
  });
  const concepts = useMemo(
    () => [...new Set((submitted?.data ?? []).map((a) => a.concept))],
    [submitted],
  );

  const { data: result } = useQuery({
    queryKey: ['assessment-compare', concept],
    queryFn: () => compareAttempts(concept as string),
    enabled: open && !!concept,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="tw-scope">
        <DialogHeader>
          <DialogTitle>So sánh kết quả giữa các lần làm</DialogTitle>
        </DialogHeader>
        <Select value={concept ?? undefined} onValueChange={setConcept}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn kiến thức để so sánh" />
          </SelectTrigger>
          <SelectContent className="tw-scope">
            {concepts.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {result && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Thay đổi so với lần đầu:{' '}
              <span className={result.deltaFromFirst >= 0 ? 'font-semibold text-success' : 'font-semibold text-danger'}>
                {result.deltaFromFirst >= 0 ? '+' : ''}
                {result.deltaFromFirst}%
              </span>
            </p>
            <div className="flex flex-col gap-1">
              {result.attempts.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between rounded-control bg-muted px-3 py-2 text-sm">
                  <span>Lần {i + 1} — {new Date(a.submittedAt).toLocaleDateString('vi-VN')}</span>
                  <span className="font-semibold">{a.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AssessmentPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [conceptFilter, setConceptFilter] = useState<string | null>(null);
  const [tableKey, setTableKey] = useState(0);

  const { data: allAssessments } = useQuery({
    queryKey: ['assessment-all-for-concept-filter'],
    queryFn: () => listAssessments({ page: 1, limit: 100 }),
  });
  const concepts = useMemo(() => [...new Set((allAssessments?.data ?? []).map((a) => a.concept))], [allAssessments]);

  const columns: ColumnDef<Assessment>[] = [
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) =>
        getValue<string>() === 'in_progress' ? (
          <StatusBadge variant="warning">Đang làm</StatusBadge>
        ) : (
          <StatusBadge variant="info">Đã nộp</StatusBadge>
        ),
    },
    {
      accessorKey: 'score',
      header: 'Điểm',
      cell: ({ row }) => (row.original.status === 'submitted' ? `${row.original.score}%` : '—'),
    },
    {
      id: 'result',
      header: 'Kết quả',
      cell: ({ row }) =>
        row.original.status !== 'submitted' ? (
          '—'
        ) : row.original.passed ? (
          <StatusBadge variant="success">Đạt</StatusBadge>
        ) : (
          <StatusBadge variant="danger">Chưa đạt</StatusBadge>
        ),
    },
    {
      accessorKey: 'submittedAt',
      header: 'Nộp lúc',
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? new Date(v).toLocaleString('vi-VN') : '—';
      },
    },
  ];

  return (
    <AppShell
      menu={studentMenu}
      title="Đánh giá"
      breadcrumb={['Trang chủ', 'Đánh giá']}
      userName={mockUser.name}
      roleLabel="Sinh viên năm 2"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Đánh giá</h1>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Select
          value={conceptFilter ?? '__all__'}
          onValueChange={(v) => {
            setConceptFilter(v === '__all__' ? null : v);
            setTableKey((k) => k + 1);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Lọc theo kiến thức" />
          </SelectTrigger>
          <SelectContent className="tw-scope">
            <SelectItem value="__all__">Tất cả kiến thức</SelectItem>
            {concepts.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={() => setCompareOpen(true)}>
          <GitCompareArrows className="h-4 w-4" /> So sánh kết quả
        </Button>
      </div>

      <DataTablePage<Assessment>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        queryKeyPrefix="asm_"
        searchPlaceholder="Tìm trong bài làm…"
        emptyLabel="Bạn chưa có bài làm nào. Vào Thư viện đề thi để bắt đầu."
        fetcher={async ({ page, pageSize }) => {
          const res = await listAssessments({ page, limit: pageSize, concept: conceptFilter ?? undefined });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        rowActions={[
          {
            key: 'open',
            label: 'Tiếp tục / Xem kết quả',
            onSelect: (row) => setOpenId(row._id),
          },
          {
            key: 'history',
            label: 'Điểm trước/sau chấm lại',
            icon: <History className="h-4 w-4" />,
            hidden: (row) => row.status !== 'submitted',
            onSelect: (row) => setHistoryId(row._id),
          },
          {
            key: 'retry-wrong',
            label: 'Làm lại các câu sai',
            hidden: (row) => row.status !== 'submitted',
            onSelect: (row) => {
              startRetryWrong(row._id)
                .then((attempt) => setOpenId(attempt._id))
                .catch(() => toast('Không thể tạo bài làm lại — có thể bạn chưa làm sai câu nào.'));
            },
          },
        ]}
      />

      <AssessmentDialog assessmentId={openId} open={!!openId} onClose={() => setOpenId(null)} />
      <CompareDialog open={compareOpen} onClose={() => setCompareOpen(false)} />
      <ScoreHistoryDialog assessmentId={historyId} onClose={() => setHistoryId(null)} />
    </AppShell>
  );
}
