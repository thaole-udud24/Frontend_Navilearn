import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, FileText, Pencil, Search, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProcessingStatus, SubjectDocument } from '@/services/subject';
import { DocumentDetailDialog } from '../shared/DocumentDetailDialog';
import { DocumentFormDialog } from '../shared/DocumentFormDialog';
import { DocumentTable, type DocumentAction } from '../shared/DocumentTable';
import { Pager } from '../shared/Pager';
import { ImportDialog } from './components/ImportDialog';
import { useAllCatalogSubjects, useSharedDocumentActions, useSharedDocumentList } from './hooks/useSharedLibrary';

const ALL = 'all';
const PAGE_SIZE = 10;

/** FE-ADM-19..22: shared document library — upload, bulk import, edit, remove, and processing status. */
export default function AdminSharedDocumentsPage() {
  const [searchParams] = useSearchParams();
  const [subjectId, setSubjectId] = useState(searchParams.get('subjectId') ?? ALL);
  const [status, setStatus] = useState<ProcessingStatus | typeof ALL>(ALL);
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectDocument | null>(null);
  const [viewing, setViewing] = useState<SubjectDocument | null>(null);
  const [removing, setRemoving] = useState<SubjectDocument | null>(null);

  const catalog = useAllCatalogSubjects();
  const subjects = catalog.data?.data ?? [];
  const activeSubjects = subjects.filter((s) => s.status === 'active');
  const names = new Map(subjects.map((s) => [s.id, s.name]));

  const documents = useSharedDocumentList({
    subjectId: subjectId === ALL ? undefined : subjectId,
    processingStatus: status === ALL ? undefined : status,
    q: q || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const actions = useSharedDocumentActions();
  const rows = documents.data?.data ?? [];

  const documentActions: DocumentAction[] = [
    { key: 'view', label: 'Xem chi tiết', icon: <Eye />, onSelect: setViewing },
    { key: 'download', label: 'Tải xuống', icon: <Download />, onSelect: (doc) => void actions.download(doc) },
    { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: setEditing },
    { key: 'remove', label: 'Gỡ khỏi thư viện', icon: <Trash2 />, danger: true, onSelect: setRemoving },
  ];

  const resetPage = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold text-foreground">Thư viện tài liệu chung</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tài liệu dùng chung cho từng môn trong danh mục. Theo dõi trạng thái xử lý của tài liệu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={activeSubjects.length === 0} onClick={() => setImportOpen(true)}>
            <Upload />
            Nhập hàng loạt
          </Button>
          <Button disabled={activeSubjects.length === 0} onClick={() => setUploadOpen(true)}>
            <Upload />
            Tải tài liệu lên
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Select value={subjectId} onValueChange={resetPage(setSubjectId)}>
          <SelectTrigger className="w-full lg:w-64" aria-label="Lọc theo môn học">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả môn học</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.status !== 'active' && ' (ngừng sử dụng)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={resetPage((value: string) => setStatus(value as ProcessingStatus | typeof ALL))}>
          <SelectTrigger className="w-full lg:w-52" aria-label="Lọc theo trạng thái xử lý">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi trạng thái xử lý</SelectItem>
            <SelectItem value="pending">Chờ trích xuất</SelectItem>
            <SelectItem value="processed">Đã xử lý</SelectItem>
            <SelectItem value="error">Lỗi xử lý</SelectItem>
          </SelectContent>
        </Select>
        <label className="relative block lg:w-72">
          <span className="sr-only">Tìm tài liệu</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            placeholder="Tìm theo tên, mô tả, thẻ…"
            onChange={(e) => resetPage(setSearch)(e.target.value)}
          />
        </label>
      </div>

      {documents.isLoading && <Skeleton className="h-40 rounded-card" />}
      {documents.isError && (
        <div className="flex items-center gap-3 text-sm text-danger">
          Không tải được thư viện tài liệu.
          <Button variant="outline" size="sm" onClick={() => void documents.refetch()}>
            Thử lại
          </Button>
        </div>
      )}
      {documents.isSuccess && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border py-14 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chưa có tài liệu chung phù hợp.</p>
        </div>
      )}
      {rows.length > 0 && (
        <DocumentTable
          documents={rows}
          actions={documentActions}
          showProcessing
          subjectName={(doc) => names.get(doc.subject) ?? '—'}
          onOpen={setViewing}
        />
      )}
      <Pager meta={documents.data?.meta} onPage={setPage} />

      <DocumentFormDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        subjects={activeSubjects}
        submitting={actions.upload.isPending}
        onSubmit={({ file, subjectId: target, meta }) =>
          file &&
          actions.upload.mutate({ subjectId: target, file, meta }, { onSuccess: () => setUploadOpen(false) })
        }
      />
      <DocumentFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        document={editing}
        submitting={actions.update.isPending}
        onSubmit={({ meta }) =>
          editing && actions.update.mutate({ id: editing.id, meta }, { onSuccess: () => setEditing(null) })
        }
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        subjects={activeSubjects}
        importing={actions.importBulk.isPending}
        onImport={(input) => actions.importBulk.mutateAsync(input)}
      />
      <DocumentDetailDialog
        document={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        onDownload={(doc) => void actions.download(doc)}
        showProcessing
      />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Gỡ tài liệu khỏi thư viện chung?"
        description={`Tài liệu "${removing?.name ?? ''}" và tệp đính kèm sẽ bị xóa khỏi thư viện chung.`}
        confirmLabel="Gỡ tài liệu"
        onConfirm={() => removing && actions.remove.mutate(removing.id)}
      />
    </div>
  );
}
