import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Archive, Eye, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { AddButton } from '@/components/ui/add-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogBody, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DetailRow, FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { SourceBadge } from '@/components/SourceBadge';
import { ConceptSelect } from '@/components/ConceptSelect';
import { ObjectivesEditor } from '@/components/ObjectivesEditor';
import { TheoryBlockEditor } from '@/components/TheoryBlockEditor';
import { QuestionPicker } from '@/components/QuestionPicker';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import {
  archiveLesson,
  createLesson,
  listLessons,
  publishLesson,
  removeLesson,
  updateLesson,
} from '@/services/lesson';
import type { Lesson, LessonStatus } from '@/services/lesson/types';

const conceptName = (c: Lesson['concept']) => (typeof c === 'string' ? c : c.name);

const STATUS_LABEL: Record<LessonStatus, string> = {
  draft: 'Nháp',
  published: 'Đã xuất bản',
  archived: 'Lưu trữ',
};
const STATUS_VARIANT: Record<LessonStatus, 'success' | 'neutral' | 'warning'> = {
  draft: 'neutral',
  published: 'success',
  archived: 'warning',
};

function LessonFormDialog({
  lesson,
  onClose,
  onSaved,
}: {
  lesson: Lesson | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = lesson === 'new';
  const existing = isNew ? null : lesson;
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [theoryContent, setTheoryContent] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    if (lesson === 'new') {
      setTitle('');
      setConcept('');
      setObjectives([]);
      setTheoryContent('');
      setQuestions([]);
      setEstimatedMinutes(30);
      return;
    }
    setTitle(lesson.title);
    setConcept(typeof lesson.concept === 'string' ? lesson.concept : lesson.concept._id);
    setObjectives(lesson.objectives);
    setTheoryContent(lesson.theoryContent ?? '');
    setQuestions(lesson.questions);
    setEstimatedMinutes(lesson.estimatedMinutes);
  }, [lesson]);

  const submit = async () => {
    if (!title.trim() || !concept) {
      toast.error('Cần có tên bài và môn học');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        concept,
        objectives,
        theoryContent,
        questions,
        estimatedMinutes,
      };
      if (isNew) await createLesson(payload);
      else if (existing) await updateLesson(existing._id, payload);
      toast.success(isNew ? 'Đã tạo bài học' : 'Đã cập nhật bài học');
      onSaved();
      onClose();
    } catch {
      toast.error('Lưu bài học thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!lesson} onOpenChange={(v) => !v && onClose()}>
      <DialogContent expandable size="lg" className="tw-scope flex max-h-[85vh] flex-col">
        <DialogHeader>
          <FormDialogTitle icon={isNew ? Plus : Pencil}>
            {isNew ? 'Thêm bài học' : 'Chỉnh sửa bài học'}
          </FormDialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-3">
            <FormField label="Tên bài học" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Biến và kiểu dữ liệu"
              />
            </FormField>
            <FormField label="Môn học / kiến thức" required>
              <ConceptSelect value={concept} onChange={setConcept} />
            </FormField>
            <FormField label="Thời lượng ước tính (phút)">
              <Input
                type="number"
                min={5}
                max={480}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-28"
              />
            </FormField>
            <ObjectivesEditor value={objectives} onChange={setObjectives} />
            <TheoryBlockEditor value={theoryContent} onChange={setTheoryContent} />
            <QuestionPicker concept={concept} selected={questions} onChange={setQuestions} />
          </div>
        </DialogBody>
        <FormDialogFooter
          onCancel={onClose}
          submitLabel={isNew ? 'Thêm mới' : 'Lưu lại'}
          onSubmit={submit}
          submitting={saving}
        />
      </DialogContent>
    </Dialog>
  );
}

function ViewLessonDialog({ lesson, onClose }: { lesson: Lesson | null; onClose: () => void }) {
  return (
    <Dialog open={!!lesson} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="lg" className="tw-scope flex max-h-[85vh] flex-col">
        <DialogHeader>
          <FormDialogTitle icon={Eye}>Chi tiết bài học</FormDialogTitle>
        </DialogHeader>
        {lesson && (
          <DialogBody>
            <div className="flex flex-col gap-3 text-sm">
              <DetailRow label="Tên bài học">{lesson.title}</DetailRow>
              <DetailRow label="Môn học">{conceptName(lesson.concept)}</DetailRow>
              <div className="flex items-center gap-2">
                <StatusBadge variant={STATUS_VARIANT[lesson.status]}>
                  {STATUS_LABEL[lesson.status]}
                </StatusBadge>
                {lesson.source === 'ai' && <SourceBadge source="ai" />}
              </div>
              {lesson.objectives.length > 0 && (
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase text-muted-foreground">
                    Sau bài này bạn có thể
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {lesson.objectives.map((o, i) => (
                      <li key={i}>• {o}</li>
                    ))}
                  </ul>
                </div>
              )}
              {lesson.theoryContent && <TheoryBlockViewer raw={lesson.theoryContent} />}
              <DetailRow label="Số câu hỏi">{lesson.questions.length}</DetailRow>
            </div>
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function LessonAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [editing, setEditing] = useState<Lesson | 'new' | null>(null);
  const [viewing, setViewing] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState<Lesson | null>(null);

  const reload = () => setTableKey((k) => k + 1);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await removeLesson(deleting._id);
      toast.success(`Đã xoá bài học "${deleting.title}"`);
      reload();
    } catch {
      toast.error('Xoá bài học thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<Lesson>[] = [
    { accessorKey: 'title', header: 'Tên bài học', meta: { enableColumnSearch: true } },
    { id: 'concept', header: 'Môn học', cell: ({ row }) => conceptName(row.original.concept) },
    { id: 'questions', header: 'Số câu hỏi', cell: ({ row }) => row.original.questions.length },
    { accessorKey: 'estimatedMinutes', header: 'Thời lượng (phút)' },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABEL[row.original.status]}
        </StatusBadge>
      ),
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Thư viện bài học"
      breadcrumb={['Trang chủ', 'Quản trị nội dung', 'Thư viện bài học']}
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
        <h1 className="text-xl font-bold text-foreground">Thư viện bài học</h1>
        <AddButton onClick={() => setEditing('new')}>Thêm bài học</AddButton>
      </div>
      <DataTablePage<Lesson>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo tên bài học…"
        emptyLabel="Chưa có bài học nào"
        fetcher={async ({ page, pageSize }) => {
          const res = await listLessons({ page, limit: pageSize });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        rowActions={[
          { key: 'view', label: 'Xem chi tiết', icon: <Eye />, onSelect: (row) => setViewing(row) },
          { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: (row) => setEditing(row) },
          {
            key: 'publish',
            label: 'Xuất bản',
            icon: <Sparkles />,
            hidden: (row) => row.status === 'published',
            onSelect: async (row) => {
              await publishLesson(row._id);
              toast.success(`Đã xuất bản "${row.title}"`);
              reload();
            },
          },
          {
            key: 'archive',
            label: 'Lưu trữ',
            icon: <Archive />,
            hidden: (row) => row.status === 'archived',
            onSelect: async (row) => {
              await archiveLesson(row._id);
              toast.success(`Đã lưu trữ "${row.title}"`);
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

      <LessonFormDialog lesson={editing} onClose={() => setEditing(null)} onSaved={reload} />
      <ViewLessonDialog lesson={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Xoá bài học?"
        description={`Bài học "${deleting?.title ?? ''}" sẽ bị xoá khỏi thư viện.`}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
