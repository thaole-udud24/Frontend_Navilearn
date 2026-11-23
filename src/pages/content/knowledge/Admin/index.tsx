import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, Eye, Pencil, Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DetailRow, FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTablePage, ClampLine } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { SourceBadge } from '@/components/SourceBadge';
import {
  createConcept,
  exportConcepts,
  getConcept,
  importConcepts,
  listConcepts,
  removeConcept,
  updateConcept,
  updateConceptStatus,
} from '@/services/knowledge';
import type { Concept, ConceptRef } from '@/services/knowledge/types';
import { generateConceptDraft } from '@/services/ai-assist';
import type { ConceptDraft } from '@/services/ai-assist/types';

const csvToIds = (csv: string) =>
  csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const refId = (r: ConceptRef | string | null | undefined) => (!r ? '' : typeof r === 'string' ? r : r._id);
const refName = (r: ConceptRef | string | null | undefined) => (!r ? '' : typeof r === 'string' ? r : r.name);

function CreateConceptDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentConcept, setParentConcept] = useState('');
  const [prerequisitesCsv, setPrerequisitesCsv] = useState('');
  const [relatedCsv, setRelatedCsv] = useState('');

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên kiến thức');
      return;
    }
    try {
      await createConcept({
        name: name.trim(),
        description: description.trim() || undefined,
        parentConcept: parentConcept.trim() || undefined,
        prerequisites: csvToIds(prerequisitesCsv),
        related: csvToIds(relatedCsv),
      });
      toast.success('Đã tạo kiến thức mới');
      setName('');
      setDescription('');
      setParentConcept('');
      setPrerequisitesCsv('');
      setRelatedCsv('');
      onSaved();
      onClose();
    } catch {
      toast.error('Tạo kiến thức thất bại — kiểm tra lại mã kiến thức cha/tiên quyết/liên quan.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="tw-scope max-w-md">
        <DialogHeader>
          <FormDialogTitle icon={Plus}>Thêm mới Kiến thức</FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <FormField label="Tên kiến thức" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Đạo hàm" />
          </FormField>
          <FormField label="Mô tả">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn (không bắt buộc)"
            />
          </FormField>
          {/* shortcut: raw concept id, no concept picker UI yet — mirrors other admin forms in this codebase */}
          <FormField label="Kiến thức cha" className="text-muted-foreground">
            <Input
              value={parentConcept}
              onChange={(e) => setParentConcept(e.target.value)}
              placeholder="Mã kiến thức cha (không bắt buộc — phân cấp chương/chủ đề)"
            />
          </FormField>
          <FormField label="Kiến thức tiên quyết" className="text-muted-foreground">
            <Input
              value={prerequisitesCsv}
              onChange={(e) => setPrerequisitesCsv(e.target.value)}
              placeholder="Mã kiến thức, phân tách bằng dấu phẩy (không bắt buộc)"
            />
          </FormField>
          <FormField label="Kiến thức liên quan" className="text-muted-foreground">
            <Input
              value={relatedCsv}
              onChange={(e) => setRelatedCsv(e.target.value)}
              placeholder="Mã kiến thức, phân tách bằng dấu phẩy (không bắt buộc)"
            />
          </FormField>
        </div>
        <FormDialogFooter onCancel={onClose} submitLabel="Thêm mới" onSubmit={submit} />
      </DialogContent>
    </Dialog>
  );
}

function EditConceptDialog({
  concept,
  onClose,
  onSaved,
}: {
  concept: Concept | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentConcept, setParentConcept] = useState('');
  const [prerequisitesCsv, setPrerequisitesCsv] = useState('');
  const [relatedCsv, setRelatedCsv] = useState('');

  const load = async (c: Concept | null) => {
    setName(c?.name ?? '');
    setDescription(c?.description ?? '');
    setParentConcept('');
    setPrerequisitesCsv('');
    setRelatedCsv('');
    if (!c) return;
    // The row from the table list doesn't carry prerequisites/related — fetch the full record.
    const full = await getConcept(c._id);
    setParentConcept(refId(full.parentConcept));
    setPrerequisitesCsv((full.prerequisites ?? []).map(refId).join(', '));
    setRelatedCsv((full.related ?? []).map(refId).join(', '));
  };

  const submit = async () => {
    if (!concept) return;
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên kiến thức');
      return;
    }
    try {
      await updateConcept(concept._id, {
        name: name.trim(),
        description: description.trim() || undefined,
        parentConcept: parentConcept.trim() || null,
        prerequisites: csvToIds(prerequisitesCsv),
        related: csvToIds(relatedCsv),
      });
      toast.success('Đã cập nhật kiến thức');
      onSaved();
      onClose();
    } catch {
      toast.error('Cập nhật kiến thức thất bại — kiểm tra lại mã kiến thức cha/tiên quyết/liên quan.');
    }
  };

  return (
    <Dialog
      open={!!concept}
      onOpenChange={(v) => {
        if (v) void load(concept);
        if (!v) onClose();
      }}
    >
      <DialogContent className="tw-scope max-w-md">
        <DialogHeader>
          <FormDialogTitle icon={Pencil}>Chỉnh sửa Kiến thức</FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <FormField label="Tên kiến thức" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Đạo hàm" />
          </FormField>
          <FormField label="Mô tả">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn (không bắt buộc)"
            />
          </FormField>
          <FormField label="Kiến thức cha" className="text-muted-foreground">
            <Input
              value={parentConcept}
              onChange={(e) => setParentConcept(e.target.value)}
              placeholder="Mã kiến thức cha (để trống nếu là gốc)"
            />
          </FormField>
          <FormField label="Kiến thức tiên quyết" className="text-muted-foreground">
            <Input
              value={prerequisitesCsv}
              onChange={(e) => setPrerequisitesCsv(e.target.value)}
              placeholder="Mã kiến thức, phân tách bằng dấu phẩy"
            />
          </FormField>
          <FormField label="Kiến thức liên quan" className="text-muted-foreground">
            <Input
              value={relatedCsv}
              onChange={(e) => setRelatedCsv(e.target.value)}
              placeholder="Mã kiến thức, phân tách bằng dấu phẩy"
            />
          </FormField>
        </div>
        <FormDialogFooter onCancel={onClose} submitLabel="Lưu lại" onSubmit={submit} />
      </DialogContent>
    </Dialog>
  );
}

function ViewConceptDialog({ concept, onClose }: { concept: Concept | null; onClose: () => void }) {
  const [detail, setDetail] = useState<Concept | null>(null);

  return (
    <Dialog
      open={!!concept}
      onOpenChange={(v) => {
        if (v && concept) void getConcept(concept._id).then(setDetail);
        if (!v) {
          onClose();
          setDetail(null);
        }
      }}
    >
      <DialogContent className="tw-scope max-w-md">
        <DialogHeader>
          <FormDialogTitle icon={Eye}>Chi tiết Kiến thức</FormDialogTitle>
        </DialogHeader>
        {concept && (
          <div className="flex flex-col">
            <DetailRow label="Tên kiến thức">{concept.name}</DetailRow>
            <DetailRow label="Mô tả">{concept.description || '—'}</DetailRow>
            <DetailRow label="Thứ tự">{concept.order}</DetailRow>
            <DetailRow label="Trạng thái">
              <StatusBadge variant={concept.status === 'active' ? 'success' : 'neutral'}>
                {concept.status === 'active' ? 'Hoạt động' : 'Đã ngừng'}
              </StatusBadge>
            </DetailRow>
            <DetailRow label="Kiến thức cha">
              {refName(detail?.parentConcept) || '— (kiến thức gốc)'}
            </DetailRow>
            <DetailRow label="Kiến thức tiên quyết">
              {(detail?.prerequisites ?? []).map(refName).join(', ') || '—'}
            </DetailRow>
            <DetailRow label="Kiến thức liên quan">
              {(detail?.related ?? []).map(refName).join(', ') || '—'}
            </DetailRow>
            <DetailRow label="Tạo lúc">{new Date(concept.createdAt).toLocaleString('vi-VN')}</DetailRow>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GenerateConceptAiDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [topic, setTopic] = useState('');
  const [draft, setDraft] = useState<ConceptDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTopic('');
    setDraft(null);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const result = await generateConceptDraft(topic);
      setDraft(result);
      if (!result.valid) toast('AI trả về không đúng định dạng — kiểm tra lại trước khi duyệt.');
    } catch {
      toast('Sinh khái niệm bằng AI thất bại.');
    } finally {
      setGenerating(false);
    }
  };

  const approve = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error('Vui lòng nhập tên kiến thức');
      return;
    }
    setSaving(true);
    try {
      await createConcept({
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        source: 'ai',
      });
      toast.success('Đã duyệt khái niệm AI sinh vào kho tri thức');
      onSaved();
      onClose();
      reset();
    } catch {
      toast.error('Duyệt khái niệm thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent className="tw-scope max-w-md">
        <DialogHeader>
          <FormDialogTitle icon={Sparkles}>Sinh Kiến thức bằng AI</FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Chủ đề (vd: Giải tích, Ngữ pháp tiếng Anh…)"
          />
          <Button type="button" variant="outline" onClick={generate} disabled={!topic || generating}>
            {generating ? 'Đang sinh…' : draft ? 'Sinh lại' : 'Sinh khái niệm'}
          </Button>

          {draft && (
            <div className="flex flex-col gap-2 rounded-control border border-border bg-muted/40 p-3">
              {!draft.valid && (
                <p className="text-xs font-medium text-warning">
                  AI trả về không đúng định dạng — kiểm tra lại trước khi duyệt.
                </p>
              )}
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Tên kiến thức"
              />
              <Input
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Mô tả"
              />
            </div>
          )}
        </div>
        <FormDialogFooter
          onCancel={onClose}
          submitLabel="Duyệt vào kho tri thức"
          onSubmit={approve}
          disabled={!draft}
          submitting={saving}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function AdminKnowledgeItemsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editing, setEditing] = useState<Concept | null>(null);
  const [viewing, setViewing] = useState<Concept | null>(null);
  const [deleting, setDeleting] = useState<Concept | null>(null);
  const reload = () => setTableKey((k) => k + 1);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await removeConcept(deleting._id);
      toast.success(`Đã xoá kiến thức "${deleting.name}"`);
      reload();
    } catch {
      toast.error('Xoá kiến thức thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<Concept>[] = [
    { accessorKey: 'name', header: 'Tên kiến thức', meta: { enableColumnSearch: true } },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      cell: ({ getValue }) => <ClampLine text={getValue<string>() || '—'} />,
    },
    { accessorKey: 'order', header: 'Thứ tự' },
    {
      accessorKey: 'parentConcept',
      header: 'Kiến thức cha',
      cell: ({ getValue }) => refName(getValue<Concept['parentConcept']>()) || '—',
    },
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
      cell: ({ getValue }) => <SourceBadge source={getValue<Concept['source']>()} />,
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Kho tri thức"
      breadcrumb={['Trang chủ', 'Quản trị nội dung', 'Kho tri thức']}
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
        <h1 className="text-xl font-bold text-foreground">Kho tri thức</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Thêm mới
        </Button>
      </div>
      <DataTablePage<Concept>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo tên kiến thức…"
        emptyLabel="Chưa có kiến thức nào"
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listConcepts({ page, limit: pageSize });
          const filtered = search
            ? res.data.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
            : res.data;
          return { data: filtered, total: res.meta?.total ?? filtered.length };
        }}
        toolbarActions={[
          { key: 'create', label: 'Tạo kiến thức mới', onSelect: () => setCreateOpen(true) },
          { key: 'ai-generate', label: 'Sinh khái niệm bằng AI', onSelect: () => setAiOpen(true) },
          {
            key: 'export',
            label: 'Xuất kho tri thức',
            onSelect: async () => {
              const items = await exportConcepts();
              const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'kho-tri-thuc.json';
              a.click();
              URL.revokeObjectURL(url);
            },
          },
          {
            key: 'import',
            label: 'Nhập kiến thức (dán JSON)',
            onSelect: async () => {
              const raw = window.prompt(
                'Dán danh sách kiến thức dạng JSON (mảng object name/description/order...)',
              );
              if (!raw) return;
              try {
                const items = JSON.parse(raw);
                const res = await importConcepts(items);
                toast(`Đã nhập ${res.createdCount} kiến thức, ${res.errorCount} lỗi`);
                reload();
              } catch {
                toast('JSON không hợp lệ');
              }
            },
          },
        ]}
        rowActions={[
          { key: 'view', label: 'Xem chi tiết', icon: <Eye />, onSelect: (row) => setViewing(row) },
          { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: (row) => setEditing(row) },
          {
            key: 'archive',
            label: 'Ngừng sử dụng',
            icon: <Ban />,
            danger: true,
            hidden: (row) => row.status === 'archived',
            onSelect: async (row) => {
              await updateConceptStatus(row._id, 'archived');
              toast('Đã ngừng sử dụng');
              reload();
            },
          },
          {
            key: 'restore',
            label: 'Khôi phục',
            icon: <RotateCcw />,
            hidden: (row) => row.status === 'active',
            onSelect: async (row) => {
              await updateConceptStatus(row._id, 'active');
              toast('Đã khôi phục');
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

      <CreateConceptDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={reload} />
      <GenerateConceptAiDialog open={aiOpen} onClose={() => setAiOpen(false)} onSaved={reload} />
      <EditConceptDialog concept={editing} onClose={() => setEditing(null)} onSaved={reload} />
      <ViewConceptDialog concept={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Xoá kiến thức?"
        description={`Kiến thức "${deleting?.name ?? ''}" sẽ bị xoá khỏi kho tri thức.`}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
