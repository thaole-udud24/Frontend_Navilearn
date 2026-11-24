import { useState } from 'react';
import { BookOpen, Library, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import type { Subject } from '@/services/subject';
import { SubjectFormDialog } from '../shared/SubjectFormDialog';
import { CatalogPickerDialog } from './components/CatalogPickerDialog';
import { SubjectCard } from './components/SubjectCard';
import { useSubjectActions, useSubjectList } from './hooks/useSubjects';

type Tab = 'active' | 'archived';

/** FE-STU-09..13: "Môn học của tôi" — personal subjects, pin/reorder/archive, add from the shared catalog. */
export default function StudentSubjectsPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const list = useSubjectList({ status: tab, q: q || undefined, limit: 100 });
  const allActive = useSubjectList({ limit: 100 });
  const actions = useSubjectActions();
  const subjects = list.data?.data ?? [];
  // Reordering only makes sense on the full, unfiltered list of active subjects.
  const reorderable = tab === 'active' && !q;
  const pickedCatalogIds = new Set(
    (allActive.data?.data ?? []).flatMap((s) => (s.catalogSubject ? [s.catalogSubject] : [])),
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (subject: Subject) => {
    setEditing(subject);
    setFormOpen(true);
  };

  const move = (subject: Subject, direction: -1 | 1) => {
    const ids = subjects.map((s) => s.id);
    const from = ids.indexOf(subject.id);
    const to = from + direction;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    actions.reorder.mutate(ids);
  };
  // A pinned subject never moves below an unpinned one: the server always lists pinned first.
  const canMove = (index: number, direction: -1 | 1) => {
    const neighbour = subjects[index + direction];
    return reorderable && !!neighbour && neighbour.pinned === subjects[index].pinned;
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold text-foreground">Môn học của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý môn học và tài liệu học tập của riêng bạn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPickerOpen(true)}>
            <Library />
            Chọn từ danh mục chung
          </Button>
          <Button onClick={openCreate}>
            <Plus />
            Thêm môn học
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList>
            <TabsTrigger value="active">Đang học</TabsTrigger>
            <TabsTrigger value="archived">Đã lưu trữ</TabsTrigger>
          </TabsList>
        </Tabs>
        <label className="relative block sm:w-72">
          <span className="sr-only">Tìm môn học</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            placeholder="Tìm theo tên môn…"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {list.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      )}

      {list.isError && (
        <div className="flex items-center gap-3 text-sm text-danger">
          Không tải được danh sách môn học.
          <Button variant="outline" size="sm" onClick={() => void list.refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {list.isSuccess && subjects.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border py-14 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {q
              ? 'Không có môn học phù hợp.'
              : tab === 'active'
                ? 'Bạn chưa có môn học nào. Hãy thêm môn học đầu tiên.'
                : 'Chưa có môn học nào được lưu trữ.'}
          </p>
          {tab === 'active' && !q && (
            <Button onClick={openCreate}>
              <Plus />
              Thêm môn học
            </Button>
          )}
        </div>
      )}

      {subjects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject, index) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              canMoveUp={canMove(index, -1)}
              canMoveDown={canMove(index, 1)}
              onEdit={openEdit}
              onPin={(s) => actions.pin.mutate({ id: s.id, pinned: !s.pinned })}
              onArchive={(s) => actions.archive.mutate(s.id)}
              onRestore={(s) => actions.restore.mutate(s.id)}
              onDelete={setDeleteTarget}
              onMove={move}
            />
          ))}
        </div>
      )}

      <SubjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        subject={editing}
        submitting={actions.create.isPending || actions.update.isPending}
        onSubmit={(input) => {
          const done = { onSuccess: () => setFormOpen(false) };
          if (editing) actions.update.mutate({ id: editing.id, input }, done);
          else actions.create.mutate(input, done);
        }}
      />

      <CatalogPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        pickedCatalogIds={pickedCatalogIds}
        picking={actions.createFromCatalog.isPending}
        onPick={(catalogSubject) => actions.createFromCatalog.mutate(catalogSubject.id)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa môn học vĩnh viễn?"
        description={`Môn "${deleteTarget?.name ?? ''}" cùng toàn bộ tài liệu của môn sẽ bị xóa và không thể khôi phục. Hãy tải xuống tài liệu cần giữ trước khi xóa.`}
        confirmLabel="Xóa vĩnh viễn"
        onConfirm={() => deleteTarget && actions.remove.mutate(deleteTarget.id)}
      />
    </div>
  );
}
