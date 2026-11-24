import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download, Eye, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { toApiError } from '@/services/apiError';
import {
  catalogKeys,
  downloadSharedDocument,
  listCatalog,
  listSharedDocuments,
  sharedDocumentKeys,
  type SubjectDocument,
} from '@/services/subject';
import { DocumentDetailDialog } from '../shared/DocumentDetailDialog';
import { DocumentTable, type DocumentAction } from '../shared/DocumentTable';
import { Pager } from '../shared/Pager';

const ALL = 'all';
const PAGE_SIZE = 10;

/** FE-STU-21/22: read-only shared document library, filterable by catalog subject. */
export default function StudentSharedLibraryPage() {
  const [subjectId, setSubjectId] = useState(ALL);
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<SubjectDocument | null>(null);

  const catalog = useQuery({
    queryKey: catalogKeys.list({ limit: 100 }),
    queryFn: () => listCatalog({ limit: 100 }),
  });
  const filters = {
    subjectId: subjectId === ALL ? undefined : subjectId,
    q: q || undefined,
    page,
    limit: PAGE_SIZE,
  };
  const documents = useQuery({
    queryKey: sharedDocumentKeys.list(filters),
    queryFn: () => listSharedDocuments(filters),
    placeholderData: keepPreviousData,
  });

  const subjectNames = new Map((catalog.data?.data ?? []).map((s) => [s.id, s.name]));
  const rows = documents.data?.data ?? [];
  const download = (doc: SubjectDocument) =>
    void downloadSharedDocument(doc).catch((error: unknown) => toast.error(toApiError(error).message));

  const actions: DocumentAction[] = [
    { key: 'view', label: 'Xem chi tiết', icon: <Eye />, onSelect: setViewing },
    { key: 'download', label: 'Tải xuống', icon: <Download />, onSelect: download },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tài liệu học tập</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thư viện tài liệu chung do quản trị viên cung cấp cho từng môn học.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={subjectId}
          onValueChange={(value) => {
            setSubjectId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-64" aria-label="Lọc theo môn học">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả môn học</SelectItem>
            {(catalog.data?.data ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          actions={actions}
          subjectName={(doc) => subjectNames.get(doc.subject) ?? '—'}
          onOpen={setViewing}
        />
      )}
      <Pager meta={documents.data?.meta} onPage={setPage} />

      <DocumentDetailDialog document={viewing} onOpenChange={(open) => !open && setViewing(null)} onDownload={download} />
    </div>
  );
}
