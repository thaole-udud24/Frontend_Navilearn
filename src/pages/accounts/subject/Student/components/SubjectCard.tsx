import { Link } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  FileText,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import { PATHS } from '@/routes/paths';
import type { Subject } from '@/services/subject';

export interface SubjectCardActions {
  onEdit: (subject: Subject) => void;
  onPin: (subject: Subject) => void;
  onArchive: (subject: Subject) => void;
  onRestore: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
  onMove: (subject: Subject, direction: -1 | 1) => void;
}

interface SubjectCardProps extends SubjectCardActions {
  subject: Subject;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/** One personal subject: opens its documents, with a menu for pin / reorder / edit / archive / delete. */
export function SubjectCard({ subject, canMoveUp, canMoveDown, ...actions }: SubjectCardProps) {
  const archived = subject.status === 'archived';
  return (
    <article className="relative flex flex-col gap-3 rounded-card border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={PATHS.student.courseDetail(subject.id)}
          className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
            {subject.pinned && <Pin className="h-4 w-4 shrink-0 text-primary" aria-label="Đã ghim" />}
            <span className="truncate">{subject.name}</span>
          </h3>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Thao tác với môn ${subject.name}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="tw-scope w-52" align="end">
            {!archived && (
              <>
                <DropdownMenuItem onSelect={() => actions.onEdit(subject)}>
                  <Pencil className="h-4 w-4" /> Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => actions.onPin(subject)}>
                  {subject.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  {subject.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveUp} onSelect={() => actions.onMove(subject, -1)}>
                  <ArrowUp className="h-4 w-4" /> Chuyển lên
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveDown} onSelect={() => actions.onMove(subject, 1)}>
                  <ArrowDown className="h-4 w-4" /> Chuyển xuống
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => actions.onArchive(subject)}>
                  <Archive className="h-4 w-4" /> Lưu trữ
                </DropdownMenuItem>
              </>
            )}
            {archived && (
              <DropdownMenuItem onSelect={() => actions.onRestore(subject)}>
                <ArchiveRestore className="h-4 w-4" /> Khôi phục
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onSelect={() => actions.onDelete(subject)}>
              <Trash2 className="h-4 w-4" /> Xóa vĩnh viễn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {subject.description || 'Chưa có mô tả'}
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          {subject.documentCount} tài liệu
        </span>
        {subject.catalogSubject && <StatusBadge variant="info">Danh mục chung</StatusBadge>}
        {archived && <StatusBadge variant="neutral">Đã lưu trữ</StatusBadge>}
      </div>
    </article>
  );
}
