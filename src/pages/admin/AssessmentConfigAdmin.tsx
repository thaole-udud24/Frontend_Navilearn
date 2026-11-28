import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import type { ApiError } from '@/services/apiError';
import { Ban, Copy, Eye, Pencil, Plus, Repeat, RotateCcw, Settings2, Trash2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { AddButton } from '@/components/ui/add-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DetailRow, FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { SourceBadge } from '@/components/SourceBadge';
import { ConceptSelect } from '@/components/ConceptSelect';
import {
  archiveAssessmentConfig,
  createAssessmentConfig,
  duplicateAssessmentConfig,
  exportAssessmentConfigs,
  importAssessmentConfigs,
  listAssessmentConfigs,
  removeAssessmentConfig,
  restoreAssessmentConfig,
  updateAssessmentConfig,
  updateAssessmentConfigPolicy,
} from '@/services/assessment-config';
import type {
  AssessmentConfig,
  AssessmentConfigKind,
  ShowAnswersPolicy,
} from '@/services/assessment-config/types';
import { getQuestion } from '@/services/question-bank';
import type { Question, QuestionDifficulty } from '@/services/question-bank/types';

const DIFFICULTY_LABEL: Record<QuestionDifficulty, string> = { easy: 'Dễ', medium: 'TB', hard: 'Khó' };

/** Real, read-only difficulty mix among the questions the admin actually picked for this config —
 * not a selection-by-percentage mechanic, which nothing on this screen's backend model supports
 * (AssessmentConfigItem just stores a `questions[]` id list; `difficulty_mix` as a generation input
 * belongs to the AI question-bank generator, a different flow — see question-bank.model.js). */
function QuestionPreviewPanel({ questions }: { questions: Question[] }) {
  if (!questions.length) return null;
  const counts: Record<QuestionDifficulty, number> = { easy: 0, medium: 0, hard: 0 };
  questions.forEach((q) => { counts[q.difficulty] += 1; });
  const total = questions.length;
  return (
    <p className="text-xs text-muted-foreground">
      Phân bổ độ khó trong {total} câu đã chọn:{' '}
      {(['easy', 'medium', 'hard'] as const)
        .map((d) => `${DIFFICULTY_LABEL[d]} ${Math.round((counts[d] / total) * 100)}%`)
        .join(' · ')}
    </p>
  );
}

function PreviewQuestionsDialog({
  open,
  onClose,
  questions,
}: {
  open: boolean;
  onClose: () => void;
  questions: Question[];
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="md" className="tw-scope">
        <DialogHeader>
          <FormDialogTitle icon={Eye}>Xem thử đề bài ({questions.length} câu)</FormDialogTitle>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto py-2">
          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có câu hỏi hợp lệ nào trong danh sách.</p>
          )}
          {questions.map((q, idx) => (
            <div key={q._id} className="rounded-control border border-border p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  Câu {idx + 1}. {q.text}
                </p>
                <StatusBadge variant="neutral">{DIFFICULTY_LABEL[q.difficulty]}</StatusBadge>
              </div>
              {q.type !== 'essay' && (
                <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  {q.options.map((opt, oi) => (
                    <li key={oi}>
                      • {opt.text} {opt.isCorrect && <span className="text-success">(đúng)</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = (c: AssessmentConfig | null) => {
    setTitle(c?.title ?? '');
    setConcept(c?.concept ?? '');
    setQuestionsCsv(c?.questions.join(', ') ?? '');
    setKind(c?.kind ?? 'chapter_test');
    setPassScore(c?.passScore ?? 50);
    setTimeLimitMinutes(c?.timeLimitMinutes ?? 0);
    setSelectedQuestions([]);
  };

  // Resolve the typed/pasted question ids to their real records so the difficulty-mix summary and
  // "Xem thử" preview reflect what's actually in the bank, not just the id text.
  useEffect(() => {
    const ids = questionsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) {
      setSelectedQuestions([]);
      return;
    }
    let cancelled = false;
    Promise.all(ids.map((id) => getQuestion(id).catch(() => null))).then((qs) => {
      if (!cancelled) setSelectedQuestions(qs.filter((q): q is Question => !!q));
    });
    return () => {
      cancelled = true;
    };
  }, [questionsCsv]);

  const submit = async () => {
    const questions = questionsCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      if (editing) {
        await updateAssessmentConfig(editing._id, { title, questions, passScore, timeLimitMinutes, kind });
      } else {
        await createAssessmentConfig({ title, concept, questions, passScore, timeLimitMinutes, kind });
      }
      toast(editing ? 'Đã cập nhật đề bài' : 'Đã tạo đề bài mới');
      onSaved();
      onClose();
    } catch (err) {
      toast((err as ApiError)?.message || 'Lưu đề bài thất bại — kiểm tra lại mã kiến thức/câu hỏi.');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (v) load(editing);
          if (!v) onClose();
        }}
      >
      <DialogContent size="md" className="tw-scope">
        <DialogHeader>
          <FormDialogTitle icon={editing ? Pencil : Plus}>
            {editing ? 'Chỉnh sửa Cấu hình bài kiểm tra' : 'Thêm mới Cấu hình bài kiểm tra'}
          </FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Tên đề bài" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Kiểm tra giữa kỳ — Chương 1"
            />
          </FormField>
          {!editing && (
            <FormField label="Kiến thức" required>
              <ConceptSelect value={concept} onChange={setConcept} />
            </FormField>
          )}
          <FormField label="Câu hỏi">
            <textarea
              value={questionsCsv}
              onChange={(e) => setQuestionsCsv(e.target.value)}
              placeholder="Mã câu hỏi, phân tách bằng dấu phẩy (q1, q2, q3…)"
              rows={2}
              className="w-full rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <QuestionPreviewPanel questions={selectedQuestions} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!selectedQuestions.length}
                onClick={() => setPreviewOpen(true)}
              >
                Xem thử
              </Button>
            </div>
          </FormField>
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
            <Input
              type="number"
              min={0}
              max={100}
              value={passScore}
              onChange={(e) => setPassScore(Number(e.target.value))}
              placeholder="Điểm đạt (%)"
              className="w-32"
            />
            <Input
              type="number"
              min={0}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
              placeholder="Phút"
              className="w-28"
            />
          </div>
        </div>
        <FormDialogFooter
          onCancel={onClose}
          submitLabel={editing ? 'Lưu lại' : 'Thêm mới'}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
    <PreviewQuestionsDialog
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      questions={selectedQuestions}
    />
    </>
  );
}

function ViewConfigDialog({ config, onClose }: { config: AssessmentConfig | null; onClose: () => void }) {
  return (
    <Dialog open={!!config} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="md" className="tw-scope">
        <DialogHeader>
          <FormDialogTitle icon={Eye}>Chi tiết Cấu hình bài kiểm tra</FormDialogTitle>
        </DialogHeader>
        {config && (
          <div className="flex flex-col">
            <DetailRow label="Tên đề bài">{config.title}</DetailRow>
            <DetailRow label="Kiến thức">{config.concept}</DetailRow>
            <DetailRow label="Loại">{KIND_LABEL[config.kind]}</DetailRow>
            <DetailRow label="Điểm đạt">{config.passScore}%</DetailRow>
            <DetailRow label="Thời gian">{config.timeLimitMinutes || 'Không giới hạn'}</DetailRow>
            <DetailRow label="Trạng thái">
              <StatusBadge variant={config.status === 'active' ? 'success' : 'neutral'}>
                {config.status === 'active' ? 'Hoạt động' : 'Đã ngừng'}
              </StatusBadge>
            </DetailRow>
            <DetailRow label={`Câu hỏi (${config.questions.length})`}>
              {config.questions.join(', ')}
            </DetailRow>
            <DetailRow label="Chính sách làm lại">
              Số lần tối đa: {config.retryPolicy?.maxAttempts || 'Không giới hạn'} • Thời gian chờ:{' '}
              {config.retryPolicy?.cooldownMinutes ?? 0} phút
            </DetailRow>
            <DetailRow label="Hiển thị đáp án">
              {config.showAnswersPolicy === 'after_due'
                ? 'Sau hạn'
                : config.showAnswersPolicy === 'never'
                  ? 'Không hiện đáp án'
                  : 'Ngay sau khi nộp'}
            </DetailRow>
          </div>
        )}
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) load(target);
        if (!v) onClose();
      }}
    >
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <FormDialogTitle icon={Settings2}>Chính sách làm lại &amp; hiển thị đáp án</FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Số lần làm lại tối đa">
            <Input
              type="number"
              min={0}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              placeholder="0 = không giới hạn"
            />
          </FormField>
          <FormField label="Thời gian chờ giữa các lần (phút)">
            <Input
              type="number"
              min={0}
              value={cooldownMinutes}
              onChange={(e) => setCooldownMinutes(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Hiển thị đáp án">
            <Select
              value={showAnswersPolicy}
              onValueChange={(v) => setShowAnswersPolicy(v as ShowAnswersPolicy)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-scope">
                <SelectItem value="after_submit">Hiện đáp án ngay sau khi nộp</SelectItem>
                <SelectItem value="after_due">Hiện đáp án sau hạn</SelectItem>
                <SelectItem value="never">Không hiện đáp án</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <FormDialogFooter onCancel={onClose} submitLabel="Lưu lại" onSubmit={submit} />
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
  const [viewing, setViewing] = useState<AssessmentConfig | null>(null);
  const [deleting, setDeleting] = useState<AssessmentConfig | null>(null);

  const reload = () => setTableKey((k) => k + 1);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await removeAssessmentConfig(deleting._id);
      toast.success(`Đã xoá cấu hình "${deleting.title}"`);
      reload();
    } catch (err) {
      toast.error((err as ApiError)?.message || 'Xoá cấu hình thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<AssessmentConfig>[] = [
    { accessorKey: 'title', header: 'Tên đề bài', meta: { enableColumnSearch: true } },
    {
      accessorKey: 'kind',
      header: 'Loại',
      cell: ({ getValue }) => KIND_LABEL[getValue<AssessmentConfigKind>()],
    },
    { id: 'questionCount', header: 'Số câu hỏi', cell: ({ row }) => row.original.questions.length },
    { accessorKey: 'passScore', header: 'Điểm đạt', cell: ({ getValue }) => `${getValue<number>()}%` },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) =>
        getValue<string>() === 'active' ? (
          <StatusBadge variant="success">Hoạt động</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">Đã ngừng</StatusBadge>
        ),
    },
    {
      accessorKey: 'source',
      header: 'Nguồn',
      cell: ({ getValue }) => <SourceBadge source={getValue<AssessmentConfig['source']>()} />,
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Cấu hình bài kiểm tra</h1>
        <AddButton
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Thêm mới
        </AddButton>
      </div>
      <DataTablePage<AssessmentConfig>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm đề bài…"
        emptyLabel="Chưa có cấu hình bài kiểm tra nào"
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listAssessmentConfigs({ page, limit: pageSize });
          const filtered = search
            ? res.data.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
            : res.data;
          return { data: filtered, total: res.meta?.total ?? filtered.length };
        }}
        toolbarActions={[
          {
            key: 'create',
            label: 'Tạo cấu hình mới',
            onSelect: () => {
              setEditing(null);
              setFormOpen(true);
            },
          },
          {
            key: 'export',
            label: 'Xuất cấu hình',
            onSelect: async () => {
              const items = await exportAssessmentConfigs();
              const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'cau-hinh-bai-kiem-tra.json';
              a.click();
              URL.revokeObjectURL(url);
            },
          },
          {
            key: 'import',
            label: 'Nhập cấu hình (dán JSON)',
            onSelect: async () => {
              const raw = window.prompt(
                'Dán danh sách cấu hình dạng JSON (mảng object title/concept/questions...)',
              );
              if (!raw) return;
              try {
                const items = JSON.parse(raw);
                const res = await importAssessmentConfigs(items);
                toast(`Đã nhập ${res.createdCount} cấu hình, ${res.errorCount} lỗi`);
                reload();
              } catch (err) {
                toast.error((err as ApiError)?.message || 'JSON không hợp lệ hoặc nhập cấu hình thất bại');
              }
            },
          },
        ]}
        rowActions={[
          { key: 'view', label: 'Xem chi tiết', icon: <Eye />, onSelect: (row) => setViewing(row) },
          {
            key: 'edit',
            label: 'Chỉnh sửa',
            icon: <Pencil />,
            onSelect: (row) => {
              setEditing(row);
              setFormOpen(true);
            },
          },
          {
            key: 'policy',
            label: 'Chính sách làm lại/đáp án',
            icon: <Repeat />,
            onSelect: (row) => {
              setEditing(row);
              setPolicyOpen(true);
            },
          },
          {
            key: 'duplicate',
            label: 'Sao chép cấu hình',
            icon: <Copy />,
            onSelect: async (row) => {
              await duplicateAssessmentConfig(row._id);
              toast('Đã sao chép cấu hình');
              reload();
            },
          },
          {
            key: 'archive',
            label: 'Ngừng sử dụng',
            icon: <Ban />,
            danger: true,
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
            icon: <RotateCcw />,
            hidden: (row) => row.status === 'active',
            onSelect: async (row) => {
              await restoreAssessmentConfig(row._id);
              toast('Đã khôi phục cấu hình');
              reload();
            },
          },
          {
            key: 'delete',
            label: 'Xoá',
            icon: <Trash2 />,
            danger: true,
            onSelect: (row) => setDeleting(row),
          },
        ]}
      />

      <ConfigFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        onSaved={reload}
      />
      <PolicyDialog
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
        target={editing}
        onSaved={reload}
      />
      <ViewConfigDialog config={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Xoá cấu hình bài kiểm tra?"
        description={`Cấu hình "${deleting?.title ?? ''}" sẽ bị xoá.`}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
