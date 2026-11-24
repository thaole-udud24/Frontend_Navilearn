import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, FileText, Trash2, Upload } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTablePage, ClampLine } from '@/components/DataTablePage';
import { ConceptSelect } from '@/components/ConceptSelect';
import { listAssets, removeAsset, uploadAsset } from '@/services/asset';
import type { Asset } from '@/services/asset/types';
import { apiOrigin } from '@/utils/request';

const conceptName = (c: Asset['concept']) => (!c ? '' : typeof c === 'string' ? c : c.name);

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadDialog({ open, onOpenChange, onUploaded }: { open: boolean; onOpenChange: (v: boolean) => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () => uploadAsset({ file: file!, title: title.trim(), concept: concept || undefined, description: description || undefined }),
    onSuccess: () => {
      toast.success('Đã tải lên tài liệu');
      setFile(null);
      setTitle('');
      setConcept('');
      setDescription('');
      onOpenChange(false);
      onUploaded();
    },
    onError: () => toast.error('Tải lên thất bại — chỉ nhận PDF/DOCX, tối đa 20 MB'),
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
          <Input placeholder="Tên tài liệu" value={title} onChange={(e) => setTitle(e.target.value)} />
          <ConceptSelect value={concept} onChange={setConcept} placeholder="Môn học (không bắt buộc)" />
          <Input
            placeholder="Mô tả (không bắt buộc)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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

export default function AssetAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<Asset | null>(null);

  const reload = () => setTableKey((k) => k + 1);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await removeAsset(deleting._id);
      toast.success(`Đã xoá "${deleting.title}"`);
      reload();
    } catch {
      toast.error('Xoá thất bại');
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
      accessorKey: 'description',
      header: 'Mô tả',
      cell: ({ getValue }) => <ClampLine text={getValue<string>() || '—'} />,
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
        <Button type="button" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" /> Tải lên
        </Button>
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
          { key: 'delete', label: 'Xoá', icon: <Trash2 />, danger: true, onSelect: (row) => setDeleting(row) },
        ]}
      />

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={reload} />
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
