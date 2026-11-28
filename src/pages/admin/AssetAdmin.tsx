import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import type { ApiError } from '@/services/apiError';
import { Download, FileText, FolderTree, Pencil, Sparkles, Star, Trash2, Upload } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTablePage, ClampLine } from '@/components/DataTablePage';
import { ConceptSelect } from '@/components/ConceptSelect';
import { listAssets, removeAsset, updateAsset, uploadAsset, importAssets } from '@/services/asset';
import { DOCUMENT_ROLES } from '@/services/asset/types';
import type { Asset, DocumentRole, ProcessingStatus, UpdateAssetInput } from '@/services/asset/types';
import { ROLE_LABEL } from '@/pages/student/MyDocuments';
import { apiOrigin } from '@/utils/request';

function DocumentRoleSelect({ value, onChange }: { value: DocumentRole; onChange: (v: DocumentRole) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DocumentRole)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DOCUMENT_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABEL[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const conceptId = (c: Asset['concept']) => (!c ? '' : typeof c === 'string' ? c : c._id);
const conceptName = (c: Asset['concept']) => (!c ? '' : typeof c === 'string' ? c : c.name);

const PROCESSING_LABEL: Record<ProcessingStatus, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Chờ xử lý', variant: 'warning' },
  processed: { label: 'Đã xử lý', variant: 'success' },
  error: { label: 'Lỗi xử lý', variant: 'danger' },
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Shared fields for both the upload and the edit dialog (title/concept/role/description/tags/important/visibility). */
function AssetMetaFields({
  title,
  setTitle,
  concept,
  setConcept,
  documentRole,
  setDocumentRole,
  description,
  setDescription,
  tags,
  setTags,
  important,
  setImportant,
  studentVisible,
  setStudentVisible,
}: {
  title: string;
  setTitle: (v: string) => void;
  concept: string;
  setConcept: (v: string) => void;
  documentRole: DocumentRole;
  setDocumentRole: (v: DocumentRole) => void;
  description: string;
  setDescription: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
  important: boolean;
  setImportant: (v: boolean) => void;
  studentVisible: boolean;
  setStudentVisible: (v: boolean) => void;
}) {
  return (
    <>
      <Input placeholder="Tên tài liệu" value={title} onChange={(e) => setTitle(e.target.value)} />
      <ConceptSelect value={concept} onChange={setConcept} placeholder="Môn học (không bắt buộc)" />
      <DocumentRoleSelect value={documentRole} onChange={setDocumentRole} />
      <Input
        placeholder="Mô tả (không bắt buộc)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        placeholder="Thẻ, cách nhau bởi dấu phẩy (không bắt buộc)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={important} onCheckedChange={(v) => setImportant(v === true)} />
        Tài liệu quan trọng
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={studentVisible} onCheckedChange={(v) => setStudentVisible(v === true)} />
        Xuất bản cho sinh viên
      </label>
    </>
  );
}

const splitTags = (tags: string) => tags.split(',').map((t) => t.trim()).filter(Boolean);

function UploadDialog({ open, onOpenChange, onUploaded }: { open: boolean; onOpenChange: (v: boolean) => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [documentRole, setDocumentRole] = useState<DocumentRole>('SUPPLEMENT');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [important, setImportant] = useState(false);
  const [studentVisible, setStudentVisible] = useState(true);

  const mutation = useMutation({
    mutationFn: () =>
      uploadAsset({
        file: file!,
        title: title.trim(),
        concept: concept || undefined,
        documentRole,
        description: description || undefined,
        tags: splitTags(tags),
        important,
        studentVisible,
      }),
    onSuccess: () => {
      toast.success('Đã tải lên tài liệu');
      setFile(null);
      setTitle('');
      setConcept('');
      setDocumentRole('SUPPLEMENT');
      setDescription('');
      setTags('');
      setImportant(false);
      setStudentVisible(true);
      onOpenChange(false);
      onUploaded();
    },
    onError: (err) =>
      toast.error((err as ApiError)?.message || 'Tải lên thất bại — chỉ nhận PDF/DOCX, tối đa 20 MB'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Tải lên tài liệu nguồn</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !title) setTitle(f.name.replace(/\.(pdf|docx)$/i, ''));
            }}
          />
          <AssetMetaFields
            title={title}
            setTitle={setTitle}
            concept={concept}
            setConcept={setConcept}
            documentRole={documentRole}
            setDocumentRole={setDocumentRole}
            description={description}
            setDescription={setDescription}
            tags={tags}
            setTags={setTags}
            important={important}
            setImportant={setImportant}
            studentVisible={studentVisible}
            setStudentVisible={setStudentVisible}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled={!file || !title || mutation.isPending} onClick={() => mutation.mutate()}>
            <Upload className="h-4 w-4" /> Tải lên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  asset,
  onOpenChange,
  onSaved,
}: {
  asset: Asset | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(asset?.title ?? '');
  const [concept, setConcept] = useState(asset ? conceptId(asset.concept) : '');
  const [documentRole, setDocumentRole] = useState<DocumentRole>(asset?.documentRole ?? 'SUPPLEMENT');
  const [description, setDescription] = useState(asset?.description ?? '');
  const [tags, setTags] = useState(asset?.tags.join(', ') ?? '');
  const [important, setImportant] = useState(asset?.important ?? false);
  const [studentVisible, setStudentVisible] = useState(asset?.studentVisible ?? true);

  const mutation = useMutation({
    mutationFn: (input: UpdateAssetInput) => updateAsset(asset!._id, input),
    onSuccess: () => {
      toast.success('Đã cập nhật tài liệu');
      onOpenChange(false);
      onSaved();
    },
    onError: (err) => toast.error((err as ApiError)?.message || 'Cập nhật thất bại'),
  });

  return (
    <Dialog
      open={!!asset}
      onOpenChange={(v) => {
        if (v && asset) {
          setTitle(asset.title);
          setConcept(conceptId(asset.concept));
          setDocumentRole(asset.documentRole);
          setDescription(asset.description ?? '');
          setTags(asset.tags.join(', '));
          setImportant(asset.important);
          setStudentVisible(asset.studentVisible);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tài liệu</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <AssetMetaFields
            title={title}
            setTitle={setTitle}
            concept={concept}
            setConcept={setConcept}
            documentRole={documentRole}
            setDocumentRole={setDocumentRole}
            description={description}
            setDescription={setDescription}
            tags={tags}
            setTags={setTags}
            important={important}
            setImportant={setImportant}
            studentVisible={studentVisible}
            setStudentVisible={setStudentVisible}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!title.trim() || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                title: title.trim(),
                concept: concept || undefined,
                documentRole,
                description,
                tags: splitTags(tags),
                important,
                studentVisible,
              })
            }
          >
            Lưu lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Bulk import: pick several files at once, optionally override the target subject/concept for all
 * of them, then submit — the backend matches each file to the manifest by its original filename. */
function ImportDialog({ open, onOpenChange, onImported }: { open: boolean; onOpenChange: (v: boolean) => void; onImported: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [concept, setConcept] = useState('');

  const mutation = useMutation({
    mutationFn: () => importAssets(files, concept || undefined, []),
    onSuccess: (report) => {
      toast.success(`Đã nhập ${report.createdCount}/${report.createdCount + report.errorCount} tài liệu`);
      if (report.errorCount > 0) {
        report.errors.forEach((e) => toast.error(`${e.file}: ${e.message}`));
      }
      setFiles([]);
      setConcept('');
      onOpenChange(false);
      onImported();
    },
    onError: (err) => toast.error((err as ApiError)?.message || 'Nhập hàng loạt thất bại'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Nhập hàng loạt tài liệu nguồn</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            type="file"
            multiple
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <ConceptSelect value={concept} onChange={setConcept} placeholder="Môn học áp dụng cho tất cả (không bắt buộc)" />
          <p className="text-xs text-muted-foreground">Tên tài liệu sẽ lấy theo tên tệp.</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled={files.length === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
            <Upload className="h-4 w-4" /> Nhập {files.length > 0 ? `(${files.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A2 bulk "Gắn vào kho tri thức": tags several selected documents to one concept at once by
 * looping the same single-asset update endpoint used by EditDialog — no separate bulk endpoint
 * needed for this volume. */
function BulkConceptDialog({
  assets,
  onOpenChange,
  onDone,
}: {
  assets: Asset[];
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [concept, setConcept] = useState('');
  const [saving, setSaving] = useState(false);

  const apply = async () => {
    if (!concept) return;
    setSaving(true);
    try {
      await Promise.all(assets.map((a) => updateAsset(a._id, { concept })));
      toast.success(`Đã gắn ${assets.length} tài liệu vào kho tri thức`);
      setConcept('');
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error((err as ApiError)?.message || 'Gắn vào kho tri thức thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={assets.length > 0} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Gắn {assets.length} tài liệu vào kho tri thức</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <ConceptSelect value={concept} onChange={setConcept} placeholder="Chọn kiến thức/môn học" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled={!concept || saving} onClick={apply}>
            <FolderTree className="h-4 w-4" /> Gắn vào kho tri thức
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AssetAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState<Asset | null>(null);
  const [bulkConceptTargets, setBulkConceptTargets] = useState<Asset[]>([]);

  const reload = () => setTableKey((k) => k + 1);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await removeAsset(deleting._id);
      toast.success(`Đã xoá "${deleting.title}"`);
      reload();
    } catch (err) {
      toast.error((err as ApiError)?.message || 'Xoá thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: 'title',
      header: 'Tên tài liệu',
      meta: { enableColumnSearch: true },
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {row.original.title}
        </span>
      ),
    },
    { id: 'concept', header: 'Môn học', cell: ({ row }) => conceptName(row.original.concept) || '—' },
    {
      id: 'documentRole',
      header: 'Loại tài liệu',
      cell: ({ row }) => <StatusBadge variant="info">{ROLE_LABEL[row.original.documentRole]}</StatusBadge>,
    },
    {
      id: 'studentVisible',
      header: 'Xuất bản cho SV',
      cell: ({ row }) =>
        row.original.studentVisible ? (
          <StatusBadge variant="success">Đã xuất bản</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">Đã ẩn</StatusBadge>
        ),
    },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      cell: ({ getValue }) => <ClampLine text={getValue<string>() || '—'} />,
    },
    {
      id: 'tags',
      header: 'Thẻ',
      cell: ({ row }) =>
        row.original.tags.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {row.original.tags.map((tag) => (
              <StatusBadge key={tag} variant="info">
                {tag}
              </StatusBadge>
            ))}
          </span>
        ) : (
          '—'
        ),
    },
    {
      id: 'important',
      header: 'Quan trọng',
      cell: ({ row }) =>
        row.original.important ? <Star className="h-4 w-4 fill-warning text-warning" /> : '—',
    },
    {
      id: 'processingStatus',
      header: 'Xử lý',
      cell: ({ row }) => {
        const { label, variant } = PROCESSING_LABEL[row.original.processingStatus];
        return <StatusBadge variant={variant}>{label}</StatusBadge>;
      },
    },
    { id: 'size', header: 'Dung lượng', cell: ({ row }) => formatSize(row.original.sizeBytes) },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Tài liệu nguồn"
      breadcrumb={['Trang chủ', 'Quản trị nội dung', 'Tài liệu nguồn']}
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
        <h1 className="text-xl font-bold text-foreground">Tài liệu nguồn</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Nhập hàng loạt
          </Button>
          <Button type="button" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Tải lên
          </Button>
        </div>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Chỉ nhận PDF/DOCX, tối đa 20 MB. Hệ thống chưa hỗ trợ trích xuất văn bản (OCR) — tài liệu lưu nguyên
        file để tải/xem lại, chưa dùng để AI đọc nội dung.
      </p>
      <DataTablePage<Asset>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo tên tài liệu…"
        emptyLabel="Chưa có tài liệu nào"
        fetcher={async ({ page, pageSize }) => {
          const res = await listAssets({ page, limit: pageSize });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        rowActions={[
          {
            key: 'download',
            label: 'Tải xuống',
            icon: <Download />,
            onSelect: (row) => window.open(`${apiOrigin}${row.fileUrl}`, '_blank'),
          },
          { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: (row) => setEditing(row) },
          {
            key: 'generate-questions',
            label: 'Sinh câu hỏi (theo môn học của tài liệu)',
            icon: <Sparkles />,
            hidden: (row) => !conceptId(row.concept),
            // UC-QBK-09's generator only ever reads the Concept's own name, never a document's
            // content — there is no document-grounded generation pipeline to pre-fill from, so this
            // only pre-fills the real môn học/kiến thức this asset is tagged to, not the document itself.
            onSelect: (row) => navigate(`${PATHS.admin.questions}?genConcept=${conceptId(row.concept)}`),
          },
          { key: 'delete', label: 'Xoá', icon: <Trash2 />, danger: true, onSelect: (row) => setDeleting(row) },
        ]}
        bulkActions={[
          {
            key: 'bulk-concept',
            label: 'Gắn vào kho tri thức',
            onSelect: (rows) => setBulkConceptTargets(rows),
          },
        ]}
      />

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={reload} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={reload} />
      <EditDialog asset={editing} onOpenChange={(v) => !v && setEditing(null)} onSaved={reload} />
      <BulkConceptDialog
        assets={bulkConceptTargets}
        onOpenChange={(v) => !v && setBulkConceptTargets([])}
        onDone={reload}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Xoá tài liệu?"
        description={`Tài liệu "${deleting?.title ?? ''}" sẽ bị ẩn khỏi danh sách.`}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
