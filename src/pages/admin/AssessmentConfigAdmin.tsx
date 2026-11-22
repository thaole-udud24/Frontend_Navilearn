import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import {
  archiveAssessmentConfig,
  createAssessmentConfig,
  duplicateAssessmentConfig,
  listAssessmentConfigs,
  restoreAssessmentConfig,
  updateAssessmentConfig,
  updateAssessmentConfigPolicy,
} from '@/services/assessment-config';
import type {
  AssessmentConfig,
  AssessmentConfigKind,
  ShowAnswersPolicy,
} from '@/services/assessment-config/types';

const KIND_LABEL: Record<AssessmentConfigKind, string> = {
  placement: 'Bài kiểm tra đầu vào',
  practice: 'Luyện tập theo kiến thức',
  chapter_test: 'Kiểm tra theo chương',
  mock_exam: 'Thi thử',
  independent_check: 'Kiểm tra độc lập',
};

function ConfigFormDialog({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: AssessmentConfig | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [questionsCsv, setQuestionsCsv] = useState('');
  const [kind, setKind] = useState<AssessmentConfigKind>('chapter_test');
  const [passScore, setPassScore] = useState(50);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);

  const load = (c: AssessmentConfig | null) => {
    setTitle(c?.title ?? '');
    setConcept(c?.concept ?? '');
    setQuestionsCsv(c?.questions.join(', ') ?? '');
    setKind(c?.kind ?? 'chapter_test');
    setPassScore(c?.passScore ?? 50);
    setTimeLimitMinutes(c?.timeLimitMinutes ?? 0);
  };

  const submit = async () => {
    const questions = questionsCsv.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      if (editing) {
        await updateAssessmentConfig(editing._id, { title, questions, passScore, timeLimitMinutes, kind });
      } else {
        await createAssessmentConfig({ title, concept, questions, passScore, timeLimitMinutes, kind });
      }
      toast(editing ? 'Đã cập nhật đề bài' : 'Đã tạo đề bài mới');
      onSaved();
      onClose();
    } catch {
      toast('Lưu đề bài thất bại — kiểm tra lại mã kiến thức/câu hỏi.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) load(editing); if (!v) onClose(); }}>
      <DialogContent className="tw-scope max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Chỉnh sửa cấu hình bài kiểm tra' : 'Tạo cấu hình bài kiểm tra'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên đề bài" />
          {!editing && <Input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Mã kiến thức (concept id)" />}
          <textarea
            value={questionsCsv}
            onChange={(e) => setQuestionsCsv(e.target.value)}
            placeholder="Mã câu hỏi, phân tách bằng dấu phẩy (q1, q2, q3…)"
            rows={2}
            className="w-full rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Select value={kind} onValueChange={(v) => setKind(v as AssessmentConfigKind)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-scope">
                {Object.entries(KIND_LABEL).map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" min={0} max={100} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))} placeholder="Điểm đạt (%)" className="w-32" />
            <Input type="number" min={0} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} placeholder="Phút" className="w-28" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PolicyDialog({
  open,
  onClose,
  target,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  target: AssessmentConfig | null;
  onSaved: () => void;
}) {
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);
  const [showAnswersPolicy, setShowAnswersPolicy] = useState<ShowAnswersPolicy>('after_submit');

  const load = (c: AssessmentConfig | null) => {
    setMaxAttempts(c?.retryPolicy?.maxAttempts ?? 0);
    setCooldownMinutes(c?.retryPolicy?.cooldownMinutes ?? 0);
    setShowAnswersPolicy(c?.showAnswersPolicy ?? 'after_submit');
  };

  const submit = async () => {
    if (!target) return;
    await updateAssessmentConfigPolicy(target._id, {
      retryPolicy: { maxAttempts, cooldownMinutes },
      showAnswersPolicy,
    });
    toast('Đã cập nhật chính sách làm lại/hiển thị đáp án');
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) load(target); if (!v) onClose(); }}>
      <DialogContent className="tw-scope max-w-sm">
        <DialogHeader>
          <DialogTitle>Chính sách làm lại & hiển thị đáp án</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input type="number" min={0} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} placeholder="Số lần làm lại tối đa (0 = không giới hạn)" />
          <Input type="number" min={0} value={cooldownMinutes} onChange={(e) => setCooldownMinutes(Number(e.target.value))} placeholder="Thời gian chờ giữa các lần (phút)" />
          <Select value={showAnswersPolicy} onValueChange={(v) => setShowAnswersPolicy(v as ShowAnswersPolicy)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="tw-scope">
              <SelectItem value="after_submit">Hiện đáp án ngay sau khi nộp</SelectItem>
              <SelectItem value="after_due">Hiện đáp án sau hạn</SelectItem>
              <SelectItem value="never">Không hiện đáp án</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit}>
            Lưu chính sách
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AssessmentConfigAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [editing, setEditing] = useState<AssessmentConfig | null>(null);

  const reload = () => setTableKey((k) => k + 1);

  const columns: ColumnDef<AssessmentConfig>[] = [
    { accessorKey: 'title', header: 'Tên đề bài', meta: { enableColumnSearch: true } },
    { accessorKey: 'kind', header: 'Loại', cell: ({ getValue }) => KIND_LABEL[getValue<AssessmentConfigKind>()] },
    { id: 'questionCount', header: 'Số câu hỏi', cell: ({ row }) => row.original.questions.length },
    { accessorKey: 'passScore', header: 'Điểm đạt', cell: ({ getValue }) => `${getValue<number>()}%` },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) =>
        getValue<string>() === 'active' ? <StatusBadge variant="success">Hoạt động</StatusBadge> : <StatusBadge variant="neutral">Đã ngừng</StatusBadge>,
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Cấu hình bài kiểm tra"
      breadcrumb={['Trang chủ', 'Cấu hình bài kiểm tra']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Cấu hình bài kiểm tra</h1>
      <DataTablePage<AssessmentConfig>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm đề bài…"
        emptyLabel="Chưa có cấu hình bài kiểm tra nào"
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listAssessmentConfigs({ page, limit: pageSize });
          const filtered = search ? res.data.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())) : res.data;
          return { data: filtered, total: res.meta?.total ?? filtered.length };
        }}
        toolbarActions={[{ key: 'create', label: 'Tạo cấu hình mới', onSelect: () => { setEditing(null); setFormOpen(true); } }]}
        rowActions={[
          { key: 'edit', label: 'Chỉnh sửa', onSelect: (row) => { setEditing(row); setFormOpen(true); } },
          { key: 'policy', label: 'Chính sách làm lại/đáp án', onSelect: (row) => { setEditing(row); setPolicyOpen(true); } },
          {
            key: 'duplicate',
            label: 'Sao chép cấu hình',
            onSelect: async (row) => {
              await duplicateAssessmentConfig(row._id);
              toast('Đã sao chép cấu hình');
              reload();
            },
          },
          {
            key: 'archive',
            label: 'Ngừng sử dụng',
            hidden: (row) => row.status === 'archived',
            onSelect: async (row) => {
              await archiveAssessmentConfig(row._id);
              toast('Đã ngừng sử dụng cấu hình');
              reload();
            },
          },
          {
            key: 'restore',
            label: 'Khôi phục',
            hidden: (row) => row.status === 'active',
            onSelect: async (row) => {
              await restoreAssessmentConfig(row._id);
              toast('Đã khôi phục cấu hình');
              reload();
            },
          },
        ]}
      />

      <ConfigFormDialog open={formOpen} onClose={() => setFormOpen(false)} editing={editing} onSaved={reload} />
      <PolicyDialog open={policyOpen} onClose={() => setPolicyOpen(false)} target={editing} onSaved={reload} />
    </AppShell>
  );
}
