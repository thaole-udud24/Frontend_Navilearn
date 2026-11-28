import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import type { ApiError } from '@/services/apiError';
import { Ban, Eye, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { AddButton } from '@/components/ui/add-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DetailRow, FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { SourceBadge } from '@/components/SourceBadge';
import {
  createRubric,
  exportRubrics,
  importRubrics,
  listRubrics,
  updateRubric,
  updateRubricStatus,
} from '@/services/assessment-config';
import type { Rubric, RubricCriterion } from '@/services/assessment-config/types';

function RubricFormDialog({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: Rubric | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [totalPoints, setTotalPoints] = useState(100);
  const [criteria, setCriteria] = useState<RubricCriterion[]>([{ name: '', weightPct: 100 }]);

  const load = (r: Rubric | null) => {
    setTitle(r?.title ?? '');
    setConcept(r?.concept ?? '');
    setTotalPoints(r?.totalPoints ?? 100);
    setCriteria(r?.criteria.length ? r.criteria : [{ name: '', weightPct: 100 }]);
  };

  const cleanCriteria = criteria.filter((c) => c.name);
  const weightSum = cleanCriteria.reduce((s, c) => s + (Number(c.weightPct) || 0), 0);
  const weightOk = cleanCriteria.length > 0 && Math.abs(weightSum - 100) <= 0.01;

  const submit = async () => {
    if (!weightOk) {
      toast('Tổng % trọng số các tiêu chí phải bằng 100%.');
      return;
    }
    try {
      if (editing) await updateRubric(editing._id, { title, totalPoints, criteria: cleanCriteria });
      else await createRubric({ title, concept, totalPoints, criteria: cleanCriteria });
      toast(editing ? 'Đã cập nhật rubric' : 'Đã tạo rubric mới');
      onSaved();
      onClose();
    } catch (err) {
      toast((err as ApiError)?.message || 'Lưu rubric thất bại.');
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
      <DialogContent size="md" className="tw-scope">
        <DialogHeader>
          <FormDialogTitle icon={editing ? Pencil : Plus}>
            {editing ? 'Chỉnh sửa Rubric' : 'Thêm mới Rubric'}
          </FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField label="Tên rubric" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Rubric tự luận — Chương 1"
            />
          </FormField>
          {!editing && (
            <FormField label="Kiến thức" required>
              <Input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Mã kiến thức (concept id)"
              />
            </FormField>
          )}
          <FormField label="Tổng điểm (thang điểm chấm)" required>
            <Input
              type="number"
              min={1}
              max={1000}
              value={totalPoints}
              onChange={(e) => setTotalPoints(Number(e.target.value))}
              className="w-28"
            />
          </FormField>
          <p className="text-sm font-medium text-foreground">
            Tiêu chí chấm (% trọng số, tổng phải bằng 100%)
          </p>
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={c.name}
                onChange={(e) =>
                  setCriteria(criteria.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
                }
                placeholder="Tên tiêu chí"
                className="flex-1"
              />
              <Input
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={c.weightPct}
                onChange={(e) =>
                  setCriteria(
                    criteria.map((x, idx) => (idx === i ? { ...x, weightPct: Number(e.target.value) } : x)),
                  )
                }
                placeholder="% trọng số"
                className="w-28"
              />
              <span className="w-20 shrink-0 text-xs text-muted-foreground">
                {totalPoints && c.weightPct ? ((c.weightPct / 100) * totalPoints).toFixed(1) : 0} điểm
              </span>
              <button type="button" onClick={() => setCriteria(criteria.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-danger" />
              </button>
            </div>
          ))}
          <AddButton
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setCriteria([...criteria, { name: '', weightPct: 0 }])}
          >
            Thêm tiêu chí
          </AddButton>
          <p className={`text-sm ${weightOk ? 'text-muted-foreground' : 'font-medium text-danger'}`}>
            Tổng trọng số: {weightSum}% {weightOk ? '' : '(phải bằng 100%)'}
          </p>
        </div>
        <FormDialogFooter
          onCancel={onClose}
          submitLabel={editing ? 'Lưu lại' : 'Thêm mới'}
          onSubmit={submit}
          disabled={!weightOk}
        />
      </DialogContent>
    </Dialog>
  );
}

function ViewRubricDialog({ rubric, onClose }: { rubric: Rubric | null; onClose: () => void }) {
  return (
    <Dialog open={!!rubric} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="md" className="tw-scope">
        <DialogHeader>
          <FormDialogTitle icon={Eye}>Chi tiết Rubric</FormDialogTitle>
        </DialogHeader>
        {rubric && (
          <div className="flex flex-col">
            <DetailRow label="Tên rubric">{rubric.title}</DetailRow>
            <DetailRow label="Kiến thức">{rubric.concept}</DetailRow>
            <DetailRow label={`Tiêu chí chấm (${rubric.criteria.length})`}>
              <div className="flex flex-col gap-1">
                {rubric.criteria.map((c, i) => (
                  <span key={i}>
                    • {c.name} —{' '}
                    <span className="font-medium">
                      {c.weightPct}% ({((c.weightPct / 100) * rubric.totalPoints).toFixed(1)} điểm)
                    </span>
                    {c.description ? ` (${c.description})` : ''}
                  </span>
                ))}
              </div>
            </DetailRow>
            <DetailRow label="Tổng điểm">{rubric.totalPoints}</DetailRow>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function RubricAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rubric | null>(null);
  const [viewing, setViewing] = useState<Rubric | null>(null);

  const reload = () => setTableKey((k) => k + 1);

  const columns: ColumnDef<Rubric>[] = [
    { accessorKey: 'title', header: 'Tên rubric', meta: { enableColumnSearch: true } },
    { id: 'criteriaCount', header: 'Số tiêu chí', cell: ({ row }) => row.original.criteria.length },
    { id: 'totalPoints', header: 'Tổng điểm', cell: ({ row }) => row.original.totalPoints },
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
      cell: ({ getValue }) => <SourceBadge source={getValue<Rubric['source']>()} />,
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Rubric chấm tự luận"
      breadcrumb={['Trang chủ', 'Cấu hình bài kiểm tra', 'Rubric']}
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
        <h1 className="text-xl font-bold text-foreground">Rubric chấm tự luận</h1>
        <AddButton
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Thêm mới
        </AddButton>
      </div>
      <DataTablePage<Rubric>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm rubric…"
        emptyLabel="Chưa có rubric nào"
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listRubrics({ page, limit: pageSize });
          const filtered = search
            ? res.data.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
            : res.data;
          return { data: filtered, total: res.meta?.total ?? filtered.length };
        }}
        toolbarActions={[
          {
            key: 'create',
            label: 'Tạo rubric mới',
            onSelect: () => {
              setEditing(null);
              setFormOpen(true);
            },
          },
          {
            key: 'export',
            label: 'Xuất rubric',
            onSelect: async () => {
              const items = await exportRubrics();
              const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'rubric-cham-tu-luan.json';
              a.click();
              URL.revokeObjectURL(url);
            },
          },
          {
            key: 'import',
            label: 'Nhập rubric (dán JSON)',
            onSelect: async () => {
              const raw = window.prompt(
                'Dán danh sách rubric dạng JSON (mảng object title/concept/criteria...)',
              );
              if (!raw) return;
              try {
                const items = JSON.parse(raw);
                const res = await importRubrics(items);
                toast(`Đã nhập ${res.createdCount} rubric, ${res.errorCount} lỗi`);
                reload();
              } catch (err) {
                toast.error((err as ApiError)?.message || 'JSON không hợp lệ hoặc nhập rubric thất bại');
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
            key: 'archive',
            label: 'Ngừng sử dụng',
            icon: <Ban />,
            danger: true,
            hidden: (row) => row.status === 'archived',
            onSelect: async (row) => {
              await updateRubricStatus(row._id, 'archived');
              toast('Đã ngừng sử dụng rubric');
              reload();
            },
          },
          {
            key: 'restore',
            label: 'Khôi phục',
            icon: <RotateCcw />,
            hidden: (row) => row.status === 'active',
            onSelect: async (row) => {
              await updateRubricStatus(row._id, 'active');
              toast('Đã khôi phục rubric');
              reload();
            },
          },
        ]}
      />

      <RubricFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        onSaved={reload}
      />
      <ViewRubricDialog rubric={viewing} onClose={() => setViewing(null)} />
    </AppShell>
  );
}
