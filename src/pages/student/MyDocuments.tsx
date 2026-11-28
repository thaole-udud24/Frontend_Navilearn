import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, FileText, Pencil, Sparkles, Trash2, Upload } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { ConceptSelect } from '@/components/ConceptSelect';
import { DataTablePage, ClampLine } from '@/components/DataTablePage';
import {
  analyzeStudentDocument,
  listStudentDocuments,
  removeStudentDocument,
  updateStudentDocument,
  uploadStudentDocument,
} from '@/services/student-document';
import { DOCUMENT_ROLES } from '@/services/student-document/types';
import type { DocumentRole, StudentDocument, UpdateStudentDocumentInput } from '@/services/student-document/types';
import { apiOrigin } from '@/utils/request';
import type { ApiError } from '@/services/apiError';

export const ROLE_LABEL: Record<DocumentRole, string> = {
  SYLLABUS: 'Đề cương',
  TEXTBOOK: 'Giáo trình',
  SLIDES: 'Slide',
  PAST_EXAM: 'Đề thi cũ',
  EXERCISES: 'Bài tập',
  SUPPLEMENT: 'Tài liệu bổ sung',
  ANSWER_KEY: 'Đáp án',
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const splitTags = (tags: string) => tags.split(',').map((t) => t.trim()).filter(Boolean);

const conceptId = (c: StudentDocument['concept']) => (typeof c === 'string' ? c : c?._id ?? '');
const conceptName = (c: StudentDocument['concept']) => (typeof c === 'string' || !c ? null : c.name);

function RoleSelect({ value, onChange }: { value: DocumentRole; onChange: (v: DocumentRole) => void }) {
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

function UploadDialog({
  open,
  onOpenChange,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentRole, setDocumentRole] = useState<DocumentRole>('SUPPLEMENT');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [concept, setConcept] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      uploadStudentDocument({
        file: file!,
        title: title.trim(),
        documentRole,
        description: description || undefined,
        tags: splitTags(tags),
        concept: concept || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã tải lên tài liệu');
      setFile(null);
      setTitle('');
      setDocumentRole('SUPPLEMENT');
      setDescription('');
      setTags('');
      setConcept('');
      onOpenChange(false);
      onUploaded();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Tải lên thất bại'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Tải lên tài liệu ôn thi</DialogTitle>
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
          <RoleSelect value={documentRole} onChange={setDocumentRole} />
          <ConceptSelect value={concept} onChange={setConcept} parentConcept={null} placeholder="Môn (không bắt buộc)" />
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
  doc,
  onOpenChange,
  onSaved,
}: {
  doc: StudentDocument | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(doc?.title ?? '');
  const [documentRole, setDocumentRole] = useState<DocumentRole>(doc?.documentRole ?? 'SUPPLEMENT');
  const [description, setDescription] = useState(doc?.description ?? '');
  const [tags, setTags] = useState(doc?.tags.join(', ') ?? '');
  const [concept, setConcept] = useState(conceptId(doc?.concept));

  const mutation = useMutation({
    mutationFn: (input: UpdateStudentDocumentInput) => updateStudentDocument(doc!._id, input),
    onSuccess: () => {
      toast.success('Đã cập nhật tài liệu');
      onOpenChange(false);
      onSaved();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Cập nhật thất bại'),
  });

  return (
    <Dialog
      open={!!doc}
      onOpenChange={(v) => {
        if (v && doc) {
          setTitle(doc.title);
          setDocumentRole(doc.documentRole);
          setDescription(doc.description ?? '');
          setTags(doc.tags.join(', '));
          setConcept(conceptId(doc.concept));
        }
        onOpenChange(v);
      }}
    >
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tài liệu</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="Tên tài liệu" value={title} onChange={(e) => setTitle(e.target.value)} />
          <RoleSelect value={documentRole} onChange={setDocumentRole} />
          <ConceptSelect value={concept} onChange={setConcept} parentConcept={null} placeholder="Môn (không bắt buộc)" />
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!title.trim() || mutation.isPending}
            onClick={() =>
              mutation.mutate({ title: title.trim(), documentRole, description, tags: splitTags(tags), concept })
            }
          >
            Lưu lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MyDocumentsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const { selectedSubjectId } = useSelectedSubject();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<StudentDocument | null>(null);
  const [deleting, setDeleting] = useState<StudentDocument | null>(null);
  const [analyzedDoc, setAnalyzedDoc] = useState<StudentDocument | null>(null);

  const reload = () => setTableKey((k) => k + 1);

  const handleAnalyze = async (doc: StudentDocument) => {
    try {
      const updated = await analyzeStudentDocument(doc._id);
      setAnalyzedDoc(updated);
      reload();
      toast.success('Đã phân tích tài liệu thành công');
    } catch (err) {
      toast.error((err as ApiError).message || 'Phân tích tài liệu thất bại');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await removeStudentDocument(deleting._id);
      toast.success(`Đã xoá "${deleting.title}"`);
      reload();
    } catch (err) {
      toast.error((err as ApiError).message || 'Xoá thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<StudentDocument>[] = [
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
    {
      id: 'documentRole',
      header: 'Loại tài liệu',
      cell: ({ row }) => <StatusBadge variant="info">{ROLE_LABEL[row.original.documentRole]}</StatusBadge>,
    },
    {
      id: 'concept',
      header: 'Môn',
      cell: ({ row }) => conceptName(row.original.concept) ?? '—',
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
      id: 'processingStatus',
      header: 'Xử lý',
      cell: ({ row }) => {
        const st = row.original.processingStatus ?? 'UPLOADED';
        if (st === 'READY') return <StatusBadge variant="success">Sẵn sàng</StatusBadge>;
        if (st === 'FAILED_NO_TEXT') return <StatusBadge variant="danger">Không đọc được chữ</StatusBadge>;
        return <StatusBadge variant="warning">Chưa phân tích</StatusBadge>;
      },
    },
    { id: 'size', header: 'Dung lượng', cell: ({ row }) => formatSize(row.original.sizeBytes) },
  ];

  return (
    <AppShell
      menu={studentMenu}
      title="Tài liệu của tôi"
      breadcrumb={['Trang chủ', 'Tài liệu của tôi']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tài liệu của tôi</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tài liệu ôn thi riêng của bạn (PDF/DOCX, tối đa 20 MB, tối đa 30 tài liệu đang hoạt động). Chỉ bạn
            thấy được tài liệu này — có thể gắn vào mục tiêu ôn thi của bạn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SubjectFilterPill />
          <Button type="button" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Tải lên
          </Button>
        </div>
      </div>
      <DataTablePage<StudentDocument>
        key={`${tableKey}:${selectedSubjectId ?? 'all'}`}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo tên tài liệu…"
        emptyLabel="Bạn chưa tải lên tài liệu nào"
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listStudentDocuments({
            page: search ? 1 : page,
            limit: search ? 100 : pageSize,
            subjectId: selectedSubjectId ?? undefined,
          });
          if (search?.trim()) {
            const q = search.trim().toLowerCase();
            const filtered = res.data.filter(
              (d) =>
                d.title.toLowerCase().includes(q) ||
                (d.description ?? '').toLowerCase().includes(q) ||
                d.tags.some((t) => t.toLowerCase().includes(q)),
            );
            const start = (page - 1) * pageSize;
            return { data: filtered.slice(start, start + pageSize), total: filtered.length };
          }
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        rowActions={[
          {
            key: 'analyze',
            label: 'Phân tích tài liệu',
            icon: <Sparkles />,
            onSelect: (row) => handleAnalyze(row),
          },
          {
            key: 'download',
            label: 'Tải xuống',
            icon: <Download />,
            onSelect: (row) => window.open(`${apiOrigin}${row.fileUrl}`, '_blank'),
          },
          { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: (row) => setEditing(row) },
          { key: 'delete', label: 'Xoá', icon: <Trash2 />, danger: true, onSelect: (row) => setDeleting(row) },
        ]}
      />

      <Dialog open={!!analyzedDoc} onOpenChange={(v) => !v && setAnalyzedDoc(null)}>
        <DialogContent size="md" className="tw-scope">
          <DialogHeader>
            <DialogTitle>Kết quả phân tích tài liệu</DialogTitle>
          </DialogHeader>
          {analyzedDoc && (
            <div className="flex flex-col gap-3 py-2 text-sm">
              <div>
                <p className="font-semibold text-foreground">{analyzedDoc.title}</p>
                <p className="text-xs text-muted-foreground">
                  Trạng thái: {analyzedDoc.processingStatus ?? 'UPLOADED'}
                </p>
              </div>
              {analyzedDoc.extractedSummary && (
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-foreground">
                  <p className="mb-1 font-semibold text-muted-foreground">Tóm tắt trích xuất:</p>
                  <p>{analyzedDoc.extractedSummary}</p>
                </div>
              )}
              {(analyzedDoc.detectedTopics?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Chủ đề nhận diện:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analyzedDoc.detectedTopics!.map((t) => (
                      <StatusBadge key={t} variant="info">
                        {t}
                      </StatusBadge>
                    ))}
                  </div>
                </div>
              )}
              {(analyzedDoc.suggestedConcepts?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                    Kiến thức gợi ý ánh xạ ({analyzedDoc.suggestedConcepts!.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analyzedDoc.suggestedConcepts!.map((c) => {
                      const label = typeof c === 'string' ? c : c.name;
                      const key = typeof c === 'string' ? c : c._id;
                      return (
                        <StatusBadge key={key} variant="success">
                          {label}
                        </StatusBadge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setAnalyzedDoc(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={reload} />
      <EditDialog doc={editing} onOpenChange={(v) => !v && setEditing(null)} onSaved={reload} />
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
