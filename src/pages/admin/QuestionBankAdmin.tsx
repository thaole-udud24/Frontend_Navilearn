import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  approveFromAiDraft,
  archiveQuestion,
  createQuestion,
  duplicateQuestion,
  exportQuestions,
  findDuplicateQuestions,
  getQualityStats,
  importQuestions,
  listQuestions,
  previewRegradeImpact,
  removeQuestion,
  restoreQuestion,
  confirmRegrade,
  updateQuestion,
} from '@/services/question-bank';
import type { Question, QuestionDifficulty, QuestionOption, QuestionType } from '@/services/question-bank/types';

interface QuestionFormState {
  concept: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  referenceAnswer: string;
  difficulty: QuestionDifficulty;
  points: number;
}

const EMPTY_FORM: QuestionFormState = {
  concept: '',
  type: 'mcq',
  text: '',
  options: [{ text: '', isCorrect: true }, { text: '' }],
  referenceAnswer: '',
  difficulty: 'medium',
  points: 10,
};

function QuestionFormDialog({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: Question | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<QuestionFormState>(EMPTY_FORM);

  const load = (q: Question | null) => {
    setForm(
      q
        ? {
            concept: typeof q.concept === 'string' ? q.concept : q.concept._id,
            type: q.type,
            text: q.text,
            options: q.options.length ? q.options : EMPTY_FORM.options,
            referenceAnswer: q.referenceAnswer ?? '',
            difficulty: q.difficulty,
            points: q.points,
          }
        : EMPTY_FORM,
    );
  };

  const submit = async () => {
    try {
      const payload = {
        concept: form.concept,
        type: form.type,
        text: form.text,
        options: form.type === 'mcq' ? form.options.filter((o) => o.text) : undefined,
        referenceAnswer: form.type === 'essay' ? form.referenceAnswer : undefined,
        difficulty: form.difficulty,
        points: form.points,
      };
      if (editing) await updateQuestion(editing._id, payload);
      else await createQuestion(payload);
      toast(editing ? 'Đã cập nhật câu hỏi' : 'Đã tạo câu hỏi');
      onSaved();
      onClose();
    } catch {
      toast('Lưu câu hỏi thất bại, kiểm tra lại dữ liệu.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) load(editing);
        if (!v) onClose();
      }}
    >
      <DialogContent className="tw-scope max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Chỉnh sửa câu hỏi' : 'Thêm mới câu hỏi'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} placeholder="Mã kiến thức (concept id)" />
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="Nội dung câu hỏi"
            rows={2}
            className="w-full rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as QuestionType })}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-scope">
                <SelectItem value="mcq">Trắc nghiệm</SelectItem>
                <SelectItem value="essay">Tự luận</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as QuestionDifficulty })}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-scope">
                <SelectItem value="easy">Dễ</SelectItem>
                <SelectItem value="medium">Trung bình</SelectItem>
                <SelectItem value="hard">Khó</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              max={100}
              value={form.points}
              onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
              placeholder="Điểm"
              className="w-24"
            />
          </div>

          {form.type === 'mcq' ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Phương án (chọn đúng 1 đáp án đúng)</p>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox
                    checked={!!opt.isCorrect}
                    onCheckedChange={() =>
                      setForm({ ...form, options: form.options.map((o, idx) => ({ ...o, isCorrect: idx === i })) })
                    }
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        options: form.options.map((o, idx) => (idx === i ? { ...o, text: e.target.value } : o)),
                      })
                    }
                    placeholder={`Phương án ${i + 1}`}
                  />
                  <button type="button" onClick={() => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-danger" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setForm({ ...form, options: [...form.options, { text: '' }] })}>
                <Plus className="h-4 w-4" /> Thêm phương án
              </Button>
            </div>
          ) : (
            <textarea
              value={form.referenceAnswer}
              onChange={(e) => setForm({ ...form, referenceAnswer: e.target.value })}
              placeholder="Đáp án tham khảo (để AI chấm bài dựa vào)"
              rows={3}
              className="w-full rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
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

function ApproveAiDraftDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [logId, setLogId] = useState('');

  const submit = async () => {
    try {
      await approveFromAiDraft({ aiAssistLogId: logId });
      toast('Đã duyệt câu hỏi AI sinh vào ngân hàng');
      onSaved();
      onClose();
      setLogId('');
    } catch {
      toast('Duyệt thất bại — kiểm tra lại mã log AI.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="tw-scope max-w-sm">
        <DialogHeader>
          <DialogTitle>Duyệt câu hỏi do AI sinh</DialogTitle>
        </DialogHeader>
        <Input value={logId} onChange={(e) => setLogId(e.target.value)} placeholder="Mã log AI (aiAssistLogId)" />
        <DialogFooter>
          <Button type="button" onClick={submit} disabled={!logId}>
            Duyệt vào ngân hàng chung
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DuplicatesPanel() {
  const [groups, setGroups] = useState<{ id: string; text: string }[][] | null>(null);

  const scan = async () => {
    const res = await findDuplicateQuestions();
    setGroups(res);
    if (res.length === 0) toast('Không phát hiện câu hỏi trùng lặp');
  };

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" variant="outline" className="self-start" onClick={scan}>
        Quét câu hỏi trùng lặp
      </Button>
      {groups?.map((group, i) => (
        <div key={i} className="rounded-card border border-warning/30 bg-warning/5 p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Nhóm trùng lặp #{i + 1}</p>
          {group.map((q) => (
            <p key={q.id} className="text-sm text-muted-foreground">
              • {q.text}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

function QualityStatsPanel() {
  const columns: ColumnDef<{ question: string; text: string; attempts: number; correctRatePercent: number | null; openIssueCount: number }>[] = [
    { accessorKey: 'text', header: 'Câu hỏi' },
    { accessorKey: 'attempts', header: 'Số lần làm' },
    {
      accessorKey: 'correctRatePercent',
      header: 'Tỉ lệ đúng',
      cell: ({ getValue }) => {
        const v = getValue<number | null>();
        return v == null ? '—' : `${v}%`;
      },
    },
    { accessorKey: 'openIssueCount', header: 'Báo lỗi đang mở' },
  ];
  return (
    <DataTablePage
      columns={columns}
      getRowId={(r) => r.question}
      emptyLabel="Chưa có dữ liệu thống kê"
      fetcher={async () => {
        const res = await getQualityStats();
        return { data: res, total: res.length };
      }}
    />
  );
}

export default function QuestionBankAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [aiDraftOpen, setAiDraftOpen] = useState(false);

  const reload = () => setTableKey((k) => k + 1);

  const columns: ColumnDef<Question>[] = [
    { accessorKey: 'text', header: 'Nội dung', meta: { enableColumnSearch: true } },
    { accessorKey: 'type', header: 'Loại', cell: ({ getValue }) => (getValue<string>() === 'mcq' ? 'Trắc nghiệm' : 'Tự luận') },
    { accessorKey: 'difficulty', header: 'Độ khó' },
    { accessorKey: 'points', header: 'Điểm' },
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
      title="Ngân hàng câu hỏi"
      breadcrumb={['Trang chủ', 'Ngân hàng câu hỏi']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Ngân hàng câu hỏi</h1>
      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Câu hỏi</TabsTrigger>
          <TabsTrigger value="duplicates">Trùng lặp</TabsTrigger>
          <TabsTrigger value="quality">Thống kê chất lượng</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <DataTablePage<Question>
            key={tableKey}
            columns={columns}
            getRowId={(r) => r._id}
            searchPlaceholder="Tìm câu hỏi…"
            emptyLabel="Chưa có câu hỏi nào"
            fetcher={async ({ page, pageSize, search }) => {
              const res = await listQuestions({ page, limit: pageSize });
              const filtered = search ? res.data.filter((q) => q.text.toLowerCase().includes(search.toLowerCase())) : res.data;
              return { data: filtered, total: res.meta?.total ?? filtered.length };
            }}
            toolbarActions={[
              { key: 'create', label: 'Thêm mới câu hỏi', onSelect: () => { setEditing(null); setFormOpen(true); } },
              { key: 'ai-draft', label: 'Duyệt câu hỏi AI sinh', onSelect: () => setAiDraftOpen(true) },
              {
                key: 'export',
                label: 'Xuất ngân hàng câu hỏi',
                onSelect: async () => {
                  const items = await exportQuestions({});
                  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ngan-hang-cau-hoi.json';
                  a.click();
                  URL.revokeObjectURL(url);
                },
              },
              {
                key: 'import',
                label: 'Nhập câu hỏi (dán JSON)',
                onSelect: async () => {
                  const raw = window.prompt('Dán danh sách câu hỏi dạng JSON (mảng object concept/type/text/options...)');
                  if (!raw) return;
                  try {
                    const items = JSON.parse(raw);
                    const res = await importQuestions(items);
                    toast(`Đã nhập ${res.createdCount} câu hỏi, ${res.errorCount} lỗi`);
                    reload();
                  } catch {
                    toast('JSON không hợp lệ');
                  }
                },
              },
            ]}
            rowActions={[
              { key: 'edit', label: 'Chỉnh sửa', onSelect: (row) => { setEditing(row); setFormOpen(true); } },
              {
                key: 'duplicate',
                label: 'Sao chép câu hỏi',
                onSelect: async (row) => {
                  await duplicateQuestion(row._id);
                  toast('Đã sao chép câu hỏi');
                  reload();
                },
              },
              {
                key: 'archive',
                label: 'Ngừng sử dụng',
                hidden: (row) => row.status === 'archived',
                onSelect: async (row) => {
                  await archiveQuestion(row._id);
                  toast('Đã ngừng sử dụng câu hỏi');
                  reload();
                },
              },
              {
                key: 'restore',
                label: 'Khôi phục',
                hidden: (row) => row.status === 'active',
                onSelect: async (row) => {
                  await restoreQuestion(row._id);
                  toast('Đã khôi phục câu hỏi');
                  reload();
                },
              },
              {
                key: 'regrade',
                label: 'Xem trước & chấm lại bài bị ảnh hưởng',
                onSelect: async (row) => {
                  const preview = await previewRegradeImpact(row._id);
                  if (preview.affectedAttemptsCount === 0) {
                    toast('Không có bài làm nào bị ảnh hưởng');
                    return;
                  }
                  if (window.confirm(`Có ${preview.affectedAttemptsCount} bài làm sẽ được chấm lại theo nội dung câu hỏi hiện tại. Xác nhận?`)) {
                    const result = await confirmRegrade(row._id);
                    toast(`Đã chấm lại ${result.regradedCount} bài làm`);
                  }
                },
              },
              {
                key: 'delete',
                label: 'Xoá',
                danger: true,
                onSelect: async (row) => {
                  await removeQuestion(row._id);
                  toast('Đã xoá câu hỏi');
                  reload();
                },
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="duplicates">
          <DuplicatesPanel />
        </TabsContent>

        <TabsContent value="quality">
          <QualityStatsPanel />
        </TabsContent>
      </Tabs>

      <QuestionFormDialog open={formOpen} onClose={() => setFormOpen(false)} editing={editing} onSaved={reload} />
      <ApproveAiDraftDialog open={aiDraftOpen} onClose={() => setAiDraftOpen(false)} onSaved={reload} />
    </AppShell>
  );
}
