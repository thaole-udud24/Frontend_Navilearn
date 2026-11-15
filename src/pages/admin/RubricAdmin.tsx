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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { createRubric, listRubrics, updateRubric, updateRubricStatus } from '@/services/assessment-config';
import type { Rubric, RubricCriterion } from '@/services/assessment-config/types';

const mockUser = { name: 'Administrator' };

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
  const [criteria, setCriteria] = useState<RubricCriterion[]>([{ name: '', maxPoints: 10 }]);

  const load = (r: Rubric | null) => {
    setTitle(r?.title ?? '');
    setConcept(r?.concept ?? '');
    setCriteria(r?.criteria.length ? r.criteria : [{ name: '', maxPoints: 10 }]);
  };

  const submit = async () => {
    const cleanCriteria = criteria.filter((c) => c.name);
    try {
      if (editing) await updateRubric(editing._id, { title, criteria: cleanCriteria });
      else await createRubric({ title, concept, criteria: cleanCriteria });
      toast(editing ? 'Đã cập nhật rubric' : 'Đã tạo rubric mới');
      onSaved();
      onClose();
    } catch {
      toast('Lưu rubric thất bại.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) load(editing); if (!v) onClose(); }}>
      <DialogContent className="tw-scope max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Chỉnh sửa rubric' : 'Tạo rubric chấm tự luận'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên rubric" />
          {!editing && <Input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Mã kiến thức (concept id)" />}
          <p className="text-sm font-medium text-foreground">Tiêu chí chấm</p>
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={c.name}
                onChange={(e) => setCriteria(criteria.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                placeholder="Tên tiêu chí"
                className="flex-1"
              />
              <Input
                type="number"
                min={1}
                max={100}
                value={c.maxPoints}
                onChange={(e) => setCriteria(criteria.map((x, idx) => (idx === i ? { ...x, maxPoints: Number(e.target.value) } : x)))}
                placeholder="Điểm tối đa"
                className="w-28"
              />
              <button type="button" onClick={() => setCriteria(criteria.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-danger" />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setCriteria([...criteria, { name: '', maxPoints: 10 }])}>
            <Plus className="h-4 w-4" /> Thêm tiêu chí
          </Button>
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

export default function RubricAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [tableKey, setTableKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rubric | null>(null);

  const reload = () => setTableKey((k) => k + 1);

  const columns: ColumnDef<Rubric>[] = [
    { accessorKey: 'title', header: 'Tên rubric', meta: { enableColumnSearch: true } },
    { id: 'criteriaCount', header: 'Số tiêu chí', cell: ({ row }) => row.original.criteria.length },
    {
      id: 'totalPoints',
      header: 'Tổng điểm',
      cell: ({ row }) => row.original.criteria.reduce((sum, c) => sum + c.maxPoints, 0),
    },
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
      title="Rubric chấm tự luận"
      breadcrumb={['Trang chủ', 'Cấu hình bài kiểm tra', 'Rubric']}
      userName={mockUser.name}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Rubric chấm tự luận</h1>
      <DataTablePage<Rubric>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        queryKeyPrefix="rubric_admin_"
        searchPlaceholder="Tìm rubric…"
        emptyLabel="Chưa có rubric nào"
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listRubrics({ page, limit: pageSize });
          const filtered = search ? res.data.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())) : res.data;
          return { data: filtered, total: res.meta?.total ?? filtered.length };
        }}
        toolbarActions={[{ key: 'create', label: 'Tạo rubric mới', onSelect: () => { setEditing(null); setFormOpen(true); } }]}
        rowActions={[
          { key: 'edit', label: 'Chỉnh sửa', onSelect: (row) => { setEditing(row); setFormOpen(true); } },
          {
            key: 'archive',
            label: 'Ngừng sử dụng',
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
            hidden: (row) => row.status === 'active',
            onSelect: async (row) => {
              await updateRubricStatus(row._id, 'active');
              toast('Đã khôi phục rubric');
              reload();
            },
          },
        ]}
      />

      <RubricFormDialog open={formOpen} onClose={() => setFormOpen(false)} editing={editing} onSaved={reload} />
    </AppShell>
  );
}
