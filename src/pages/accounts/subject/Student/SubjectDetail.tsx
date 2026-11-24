import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Eye, FileText, Pencil, RefreshCw, Search, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { PATHS } from '@/routes/paths';
import type { SubjectDocument } from '@/services/subject';
import { DocumentDetailDialog } from '../shared/DocumentDetailDialog';
import { DocumentFormDialog } from '../shared/DocumentFormDialog';
import { DocumentTable, type DocumentAction } from '../shared/DocumentTable';
import { Pager } from '../shared/Pager';
import { MAX_DOCUMENTS_PER_SUBJECT } from '../shared/documentUtils';
import { ReplaceFileDialog } from './components/ReplaceFileDialog';
import { useDocumentActions, useDocumentList, useSubject, useUploadHistory } from './hooks/useSubjectDocuments';

type Tab = 'documents' | 'uploads';
const PAGE_SIZE = 10;

/** FE-STU-14..20: documents of one personal subject — search, upload, edit, replace, download, delete. */
export default function StudentSubjectDetailPage() {
  const { subjectId = '' } = useParams();
  const [tab, setTab] = useState<Tab>('documents');
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 300);
  const [importantOnly, setImportantOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectDocument | null>(null);
  const [viewing, setViewing] = useState<SubjectDocument | null>(null);
  const [replacing, setReplacing] = useState<SubjectDocument | null>(null);
  const [deleting, setDeleting] = useState<SubjectDocument | null>(null);

  const subject = useSubject(subjectId);
  const filters = { q: q || undefined, important: importantOnly || undefined, page, limit: PAGE_SIZE };
  const documents = useDocumentList(subjectId, filters);
  const uploads = useUploadHistory(subjectId, { page, limit: PAGE_SIZE }, tab === 'uploads');
  const actions = useDocumentActions(subjectId);

  const archived = subject.data?.status === 'archived';
  const count = subject.data?.documentCount ?? 0;
  const limitReached = count >= MAX_DOCUMENTS_PER_SUBJECT;
  const canUpload = !!subject.data && !archived && !limitReached;
  const active = tab === 'documents' ? documents : uploads;
  const rows = active.data?.data ?? [];

  const download: DocumentAction = {
    key: 'download',
    label: 'Tải xuống',
    icon: <Download />,
    onSelect: (doc) => void actions.download(doc),
  };
  const documentActions: DocumentAction[] = [
    { key: 'view', label: 'Xem chi tiết', icon: <Eye />, onSelect: setViewing },
    download,
    ...(archived
      ? []
      : [
          { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: setEditing },
          { key: 'replace', label: 'Thay thế tệp', icon: <RefreshCw />, onSelect: setReplacing },
        ]),
    { key: 'delete', label: 'Xóa', icon: <Trash2 />, danger: true, onSelect: setDeleting },
  ];

  if (subject.isError) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3">
        <p className="text-sm text-danger">Không tìm thấy môn học này.</p>
        <Button asChild variant="outline">
          <Link to={PATHS.student.courses}>
            <ArrowLeft />
            Về danh sách môn học
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <Link
          to={PATHS.student.courses}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Môn học của tôi
        </Link>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            {subject.isLoading ? (
              <Skeleton className="h-7 w-64" />
            ) : (
              <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <span className="truncate">{subject.data?.name}</span>
                {archived && <StatusBadge variant="neutral">Đã lưu trữ</StatusBadge>}
              </h1>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {subject.data?.description || 'Chưa có mô tả'} · {count}/{MAX_DOCUMENTS_PER_SUBJECT} tài liệu
            </p>
          </div>
          <Button disabled={!canUpload} onClick={() => setUploadOpen(true)}>
            <Upload />
            Tải tài liệu lên
          </Button>
        </div>
        {archived && (
          <p className="mt-2 text-sm text-muted-foreground">
            Môn học đã lưu trữ. Hãy khôi phục môn trước khi tải lên hoặc chỉnh sửa tài liệu.
          </p>
        )}
        {limitReached && !archived && (
          <p className="mt-2 text-sm text-warning">
            Môn học đã đạt tối đa {MAX_DOCUMENTS_PER_SUBJECT} tài liệu. Hãy xóa bớt trước khi tải thêm.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as Tab);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="documents">Tài liệu</TabsTrigger>
            <TabsTrigger value="uploads">Lịch sử tải lên</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === 'documents' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={importantOnly}
                onCheckedChange={(checked) => {
                  setImportantOnly(checked === true);
                  setPage(1);
                }}
              />
              Chỉ tài liệu quan trọng
            </label>
            <label className="relative block sm:w-72">
              <span className="sr-only">Tìm tài liệu</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                placeholder="Tìm theo tên, mô tả, thẻ…"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>
        )}
      </div>

      {active.isLoading && <Skeleton className="h-40 rounded-card" />}
      {active.isError && (
        <div className="flex items-center gap-3 text-sm text-danger">
          Không tải được danh sách tài liệu.
          <Button variant="outline" size="sm" onClick={() => void active.refetch()}>
            Thử lại
          </Button>
        </div>
      )}
      {active.isSuccess && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border py-14 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {q || importantOnly ? 'Không có tài liệu phù hợp.' : 'Môn học này chưa có tài liệu nào.'}
          </p>
        </div>
      )}
      {rows.length > 0 && (
        <DocumentTable
          documents={rows}
          actions={tab === 'uploads' ? [download] : documentActions}
          showProcessing={tab === 'uploads'}
          onOpen={setViewing}
        />
      )}
      <Pager meta={active.data?.meta} onPage={setPage} />

      <DocumentFormDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        submitting={actions.upload.isPending}
        onSubmit={({ file, meta }) =>
          file && actions.upload.mutate({ file, meta }, { onSuccess: () => setUploadOpen(false) })
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
      <ReplaceFileDialog
        document={replacing}
        onOpenChange={(open) => !open && setReplacing(null)}
        submitting={actions.replaceFile.isPending}
        onSubmit={(file) =>
          replacing && actions.replaceFile.mutate({ id: replacing.id, file }, { onSuccess: () => setReplacing(null) })
        }
      />
      <DocumentDetailDialog
        document={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        onDownload={(doc) => void actions.download(doc)}
        showProcessing
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xóa tài liệu?"
        description={`Tài liệu "${deleting?.name ?? ''}" sẽ bị xóa và không còn được dùng cho hỏi đáp AI.`}
        confirmLabel="Xóa tài liệu"
        onConfirm={() => deleting && actions.remove.mutate(deleting.id)}
      />
    </div>
  );
}
