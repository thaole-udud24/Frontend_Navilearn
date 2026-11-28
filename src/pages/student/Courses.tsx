import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  GraduationCap,
  History,
  LayoutGrid,
  MoreVertical,
  Pencil,
  PlayCircle,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { GlobalSubjectFilter } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSubjectStore } from '@/hooks/useSubjectStore';
import { toConceptId } from '@/lib/subjectUtils';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ConceptSelect } from '@/components/ConceptSelect';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import type { StatTone } from '@/components/StatCard';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOpenDraft, listGoals, listPlans } from '@/services/planning';
import { planningKeys } from '@/services/planning/queryKeys';
import { exportMasteryReport } from '@/services/mastery';
import {
  addStudentSubject,
  listStudentSubjects,
  listTrashedStudentSubjects,
  removeStudentSubject,
  restoreStudentSubject,
  studentSubjectKeys,
  updateStudentSubject,
} from '@/services/student-subject';
import type { StudentSubject } from '@/services/student-subject/types';

const conceptOf = (s: StudentSubject) => (!s.concept || typeof s.concept === 'string' ? null : s.concept);

type CourseStatus = 'active' | 'upcoming' | 'done';

const STATUS_META: Record<
  CourseStatus,
  { label: string; variant: 'info' | 'warning' | 'success'; tone: StatTone; icon: typeof BookOpen }
> = {
  active: { label: 'Đang học', variant: 'info', tone: 'blue', icon: BookOpen },
  upcoming: { label: 'Sắp học', variant: 'warning', tone: 'peach', icon: GraduationCap },
  done: { label: 'Đã hoàn thành', variant: 'success', tone: 'mint', icon: CheckCircle2 },
};

const TONE_CARD: Record<StatTone, string> = {
  blue: 'bg-gradient-to-br from-primary-soft to-card border-primary/15',
  peach: 'bg-gradient-to-br from-accent-soft to-card border-accent/20',
  mint: 'bg-gradient-to-br from-mint/35 to-card border-mint-foreground/15',
  blush: 'bg-gradient-to-br from-blush/60 to-card border-blush-foreground/15',
  lavender: 'bg-gradient-to-br from-lavender/60 to-card border-lavender-foreground/15',
  amber: 'bg-gradient-to-br from-amber/50 to-card border-amber-foreground/15',
  teal: 'bg-gradient-to-br from-teal/40 to-card border-teal-foreground/15',
};
const TONE_ICON: Record<StatTone, string> = {
  blue: 'text-primary',
  peach: 'text-accent',
  mint: 'text-mint-foreground',
  blush: 'text-blush-foreground',
  lavender: 'text-lavender-foreground',
  amber: 'text-amber-foreground',
  teal: 'text-teal-foreground',
};

// Cycled by position, not a hash of the id — a hash can (and did) place two visually-similar warm
// tones (amber/peach) next to each other in the same row. Alternating cool/warm guarantees any 3
// consecutive cards read as different colors, while the status chip still carries real status.
const TONE_CYCLE: StatTone[] = ['blue', 'amber', 'mint', 'blush', 'teal', 'peach', 'lavender'];
function toneForIndex(index: number): StatTone {
  return TONE_CYCLE[index % TONE_CYCLE.length];
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `~${m}p`;
  return m === 0 ? `~${h}h` : `~${h}h${m}p`;
}

interface CourseCardData {
  subject: StudentSubject;
  conceptId: string;
  isCustom: boolean;
  name: string;
  description?: string;
  status: CourseStatus;
  percent: number;
  remainingLessons: number;
  remainingMinutes: number;
  goalCount: number;
  planTitle?: string;
  /** Active (status 'active') goal for this subject, if any — drives the "Mục tiêu: …" line. */
  activeGoal?: { examName?: string | null; targetScore?: number | null; daysLeft: number };
}

function CourseCard({
  data,
  tone,
  onCta,
  onViewRoadmap,
  onRemove,
  onEdit,
  onTogglePin,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  data: CourseCardData;
  tone: StatTone;
  onCta: () => void;
  onViewRoadmap: () => void;
  onRemove: () => void;
  onEdit: () => void;
  onTogglePin: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const meta = STATUS_META[data.status];
  const Icon = meta.icon;
  const ctaLabel =
    data.status === 'done'
      ? 'Xem lại'
      : data.status === 'active'
        ? 'Vào học'
        : data.goalCount === 0
          ? '+ Thiết lập mục tiêu'
          : 'Tạo lộ trình';
  const CtaIcon = data.status === 'upcoming' ? Target : PlayCircle;

  return (
    <div
      className={cn(
        'relative flex min-h-[220px] flex-col gap-3 overflow-hidden rounded-card border p-4 shadow-card transition-shadow hover:shadow-lg',
        TONE_CARD[tone],
      )}
    >
      <Icon
        className={cn('pointer-events-none absolute -right-4 -top-4 h-28 w-28 opacity-10', TONE_ICON[tone])}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-2">
        <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={data.subject.pinned ? 'Bỏ ghim môn học' : 'Ghim môn học'}
            aria-pressed={data.subject.pinned}
            onClick={onTogglePin}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-control hover:bg-card/70',
              data.subject.pinned ? 'text-amber-foreground' : 'text-muted-foreground',
            )}
          >
            <Star className="h-4 w-4" fill={data.subject.pinned ? 'currentColor' : 'none'} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Thao tác môn học"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-card/70"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="tw-scope w-48" align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="h-4 w-4" /> Đổi tên / mô tả
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canMoveUp} onSelect={onMoveUp}>
                <ArrowUp className="h-4 w-4" /> Chuyển lên
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canMoveDown} onSelect={onMoveDown}>
                <ArrowDown className="h-4 w-4" /> Chuyển xuống
              </DropdownMenuItem>
              <DropdownMenuItem className="text-danger" onSelect={onRemove}>
                <Trash2 className="h-4 w-4" /> Bỏ môn này
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-foreground">{data.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {data.status === 'active' && data.planTitle
            ? `Lộ trình: ${data.planTitle}`
            : data.description || 'Chưa có mô tả'}
        </p>
      </div>

      {data.activeGoal && (
        <p className="relative flex items-center gap-1 text-xs font-medium text-foreground">
          <Flag className="h-3 w-3 text-primary" />
          Mục tiêu: {data.activeGoal.examName || 'Ôn thi'}
          {data.activeGoal.targetScore != null && ` · ${data.activeGoal.targetScore} điểm`}
          {` · còn ${Math.max(data.activeGoal.daysLeft, 0)} ngày`}
        </p>
      )}

      {data.status !== 'upcoming' ? (
        <div className="relative">
          <div className="h-2 w-full overflow-hidden rounded-full bg-card/70">
            <div
              className={cn(
                'h-full rounded-full transition-[width]',
                data.status === 'done' ? 'bg-success' : 'bg-primary',
              )}
              style={{ width: `${data.percent}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {data.remainingLessons > 0
                ? `Còn ${data.remainingLessons} buổi${formatDuration(data.remainingMinutes) ? ` · ${formatDuration(data.remainingMinutes)}` : ''}`
                : 'Hoàn tất toàn bộ buổi học'}
            </span>
            <span className="font-semibold text-foreground">{data.percent}%</span>
          </div>
        </div>
      ) : (
        <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
          <Flag className="h-3 w-3" />
          {data.goalCount === 0 ? 'Chưa có mục tiêu ôn thi' : `${data.goalCount} mục tiêu`}
        </div>
      )}

      {data.isCustom ? (
        <p className="relative mt-auto text-xs italic text-muted-foreground">Môn cá nhân</p>
      ) : (
        <div className="relative mt-auto flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="self-start bg-primary text-primary-foreground hover:bg-primary-hover"
            onClick={onCta}
          >
            <CtaIcon className="h-3.5 w-3.5" /> {ctaLabel}
          </Button>
          {data.status === 'active' && (
            <Button type="button" size="sm" variant="outline" onClick={onViewRoadmap}>
              Xem lộ trình
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ST-01: "+ Thêm môn ▾ › Chọn từ danh mục chung" — pick an existing shared top-level Concept.
function CatalogSubjectDialog({
  open,
  onOpenChange,
  excludeIds,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  excludeIds: string[];
  onAdded: () => void;
}) {
  const [concept, setConcept] = useState('');

  const mutation = useMutation({
    mutationFn: () => addStudentSubject({ concept }),
    onSuccess: () => {
      toast.success('Đã thêm môn học');
      setConcept('');
      onOpenChange(false);
      onAdded();
    },
    onError: () => toast.error('Thêm môn học thất bại — có thể bạn đã thêm môn này rồi'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Chọn từ danh mục chung</DialogTitle>
        </DialogHeader>
        <ConceptSelect
          value={concept}
          onChange={setConcept}
          parentConcept={null}
          placeholder="Chọn môn học"
        />
        {excludeIds.length > 0 && (
          <p className="text-xs text-muted-foreground">Môn đã có trong danh sách sẽ không hiện lại ở đây.</p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled={!concept || mutation.isPending} onClick={() => mutation.mutate()}>
            Thêm môn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const CUSTOM_COLORS: { value: string; className: string }[] = [
  { value: 'blue', className: 'bg-primary' },
  { value: 'mint', className: 'bg-mint-foreground' },
  { value: 'amber', className: 'bg-amber-foreground' },
  { value: 'blush', className: 'bg-blush-foreground' },
  { value: 'teal', className: 'bg-teal-foreground' },
  { value: 'lavender', className: 'bg-lavender-foreground' },
];

// ST-01: "+ Thêm môn ▾ › Tạo môn của riêng tôi" — a personal label, no shared Concept behind it,
// so it carries no lộ trình/Mastery (see CourseCard's `isCustom` branch).
function CustomSubjectDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(CUSTOM_COLORS[0].value);

  const reset = () => {
    setTitle('');
    setDescription('');
    setColor(CUSTOM_COLORS[0].value);
  };

  const mutation = useMutation({
    mutationFn: () =>
      addStudentSubject({
        customTitle: title.trim(),
        customDescription: description.trim(),
        customColor: color,
      }),
    onSuccess: () => {
      toast.success('Đã tạo môn học của bạn');
      reset();
      onOpenChange(false);
      onAdded();
    },
    onError: () => toast.error('Tạo môn học thất bại — có thể bạn đã có môn cùng tên'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Tạo môn của riêng tôi</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Tên môn *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tự học Photoshop"
              className="h-10 rounded-control border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Mô tả</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Mô tả ngắn (không bắt buộc)"
              className="rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Màu</span>
            <div className="flex gap-2">
              {CUSTOM_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-label={`Màu ${c.value}`}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'h-7 w-7 rounded-full ring-offset-2 ring-offset-card transition-shadow',
                    c.className,
                    color === c.value && 'ring-2 ring-primary',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!title.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Tạo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Rename/redescribe a self-made subject's custom* label (concept-backed subjects keep the shared
// Concept's name, so this only changes anything for `isCustom` subjects — see `name` in `cards`).
function EditSubjectDialog({
  open,
  onOpenChange,
  subject,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subject: StudentSubject | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (subject) {
      setTitle(subject.customTitle ?? '');
      setDescription(subject.customDescription ?? '');
    }
  }, [subject]);

  const mutation = useMutation({
    mutationFn: () =>
      updateStudentSubject(subject!._id, {
        customTitle: title.trim(),
        customDescription: description.trim(),
      }),
    onSuccess: () => {
      toast.success('Đã lưu thay đổi');
      onOpenChange(false);
      onSaved();
    },
    onError: () => toast.error('Lưu thay đổi thất bại'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Đổi tên / mô tả môn học</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Tên môn *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-control border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Mô tả</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// "Đã xóa gần đây": soft-deleted môn học (StudentSubjectItem.deletedAt), with a one-click restore —
// the only recovery path, since the backend has no separate ACTIVE/ARCHIVED status for this model.
function TrashDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: [...studentSubjectKeys.all, 'trash'],
    queryFn: () => listTrashedStudentSubjects({ limit: 50 }),
    enabled: open,
  });
  const items = data?.data ?? [];

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreStudentSubject(id),
    onSuccess: () => {
      toast.success('Đã khôi phục môn học');
      void queryClient.invalidateQueries({ queryKey: studentSubjectKeys.all });
    },
    onError: () => toast.error('Khôi phục thất bại'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Đã xóa gần đây</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Đang tải…</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Chưa có môn học nào đã xóa.</p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {items.map((s) => {
              const concept = conceptOf(s);
              const name = concept?.name ?? s.customTitle ?? 'Môn học';
              return (
                <li
                  key={s._id}
                  className="flex items-center justify-between gap-3 rounded-control border border-border p-2.5 text-sm"
                >
                  <span className="truncate font-medium text-foreground">{name}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={restoreMutation.isPending}
                    onClick={() => restoreMutation.mutate(s._id)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Khôi phục
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ST-01: "+ Thêm môn ▾" opens a menu with the two real ways to add a subject — never adds one
// directly, since "Tạo môn của riêng tôi" needs its own form.
function AddSubjectMenu({
  label,
  onPickCatalog,
  onPickCustom,
}: {
  label: string;
  onPickCatalog: () => void;
  onPickCustom: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AddButton>{label}</AddButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="tw-scope w-56" align="end">
        <DropdownMenuItem onSelect={onPickCatalog}>
          <LayoutGrid className="h-4 w-4" /> Chọn từ danh mục chung
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPickCustom}>
          <Sparkles className="h-4 w-4" /> Tạo môn của riêng tôi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Pages `items` 3-per-view on desktop (CSS handles 1/2/3 cols below that via `md:`/`lg:` widths),
 * sliding a flex track so each click reveals the next group — no drag, just the arrows + dots the
 * spec asks for front and center. */
function CourseCarousel({
  items,
  renderItem,
}: {
  items: CourseCardData[];
  renderItem: (item: CourseCardData, index: number) => ReactNode;
}) {
  const [page, setPage] = useState(0);
  const perView = 3;
  const pageCount = Math.max(1, Math.ceil(items.length / perView));
  const clamped = Math.min(page, pageCount - 1);

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Không có môn học nào khớp với bộ lọc hiện tại.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Floating small overlay arrows — absolutely positioned over the track's own edges instead
       * of sitting beside it as flex siblings, so the card grid keeps the exact same width/alignment
       * as the "Xem tất cả" grid view and never looks indented. */}
      <button
        type="button"
        aria-label="Nhóm môn học trước"
        disabled={clamped === 0}
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        className="absolute -left-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-card backdrop-blur disabled:cursor-not-allowed disabled:opacity-40 hover:not-disabled:bg-muted hover:not-disabled:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${clamped * 100}%)` }}
        >
          {Array.from({ length: pageCount }, (_, pi) => (
            <div key={pi} className="grid w-full shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items
                .slice(pi * perView, pi * perView + perView)
                .map((item, i) => renderItem(item, pi * perView + i))}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Nhóm môn học tiếp theo"
        disabled={clamped >= pageCount - 1}
        onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        className="absolute -right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-card backdrop-blur disabled:cursor-not-allowed disabled:opacity-40 hover:not-disabled:bg-muted hover:not-disabled:text-foreground"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {pageCount > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: pageCount }, (_, pi) => (
            <button
              key={pi}
              type="button"
              aria-label={`Trang ${pi + 1}`}
              onClick={() => setPage(pi)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                pi === clamped ? 'w-5 bg-primary' : 'w-1.5 bg-border',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TAB_LABEL: Record<'all' | CourseStatus, string> = {
  all: 'Tất cả',
  active: 'Đang ôn',
  upcoming: 'Sắp học',
  done: 'Đã hoàn thành',
};

export default function CoursesPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [editing, setEditing] = useState<StudentSubject | null>(null);
  const [removing, setRemoving] = useState<StudentSubject | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'done'>('all');
  const [sort, setSort] = useState<'newest' | 'name'>('newest');
  const [viewAll, setViewAll] = useState(false);
  const [progressRange, setProgressRange] = useState<'7' | '30' | '90'>('7');

  const { data: subjectsRes } = useQuery({
    queryKey: studentSubjectKeys.list({ limit: 50 }),
    queryFn: () => listStudentSubjects({ limit: 50 }),
  });
  const allSubjects = useMemo(() => subjectsRes?.data ?? [], [subjectsRes]);

  const { data: goalsRes } = useQuery({
    queryKey: planningKeys.goals({ limit: 100 }),
    queryFn: () => listGoals({ limit: 100 }),
  });
  const goals = useMemo(() => goalsRes?.data ?? [], [goalsRes]);

  const { data: plansRes } = useQuery({
    queryKey: planningKeys.plans({ limit: 100 }),
    queryFn: () => listPlans({ limit: 100 }),
  });
  const plans = useMemo(() => plansRes?.data ?? [], [plansRes]);

  const { data: masteryReport } = useQuery({
    queryKey: ['courses-mastery-report'],
    queryFn: () => exportMasteryReport({}),
  });

  // B2: the draft-continuation banner — an unfinished goal wizard, auto-saved with its wizardStep.
  const { data: openDraft } = useQuery({
    queryKey: ['planning-goal-draft'],
    queryFn: getOpenDraft,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: studentSubjectKeys.all });
    void useSubjectStore.getState().loadSubjects(true);
  };

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeStudentSubject(id),
    onSuccess: () => {
      toast.success('Đã bỏ môn học khỏi danh sách');
      invalidate();
    },
    onError: () => toast.error('Bỏ môn học thất bại'),
    onSettled: () => setRemoving(null),
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => updateStudentSubject(id, { pinned }),
    onSuccess: invalidate,
    onError: () => toast.error('Thao tác thất bại'),
  });

  // Manual order (ST-01 "kéo-thả" alternative: up/down buttons) re-numbers every item's
  // displayOrder as its new array index — swapping just the two raw values would be a no-op the
  // first time (every item starts at displayOrder 0, so same-value ties break by createdAt instead).
  const moveMutation = useMutation({
    mutationFn: (reordered: StudentSubject[]) =>
      Promise.all(reordered.map((s, index) => updateStudentSubject(s._id, { displayOrder: index }))),
    onSuccess: invalidate,
    onError: () => toast.error('Sắp xếp lại thất bại'),
  });
  const moveSubject = (subject: StudentSubject, direction: -1 | 1) => {
    const index = allSubjects.findIndex((s) => s._id === subject._id);
    const target = index + direction;
    if (target < 0 || target >= allSubjects.length) return;
    const reordered = [...allSubjects];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    moveMutation.mutate(reordered);
  };

  const cards: CourseCardData[] = useMemo(
    () =>
      allSubjects.map((s) => {
        const concept = conceptOf(s);
        const conceptId = toConceptId(s.concept) ?? s._id;
        const isCustom = !s.concept;
        const goalCount = goals.filter(
          (g) => toConceptId(g.concept) === conceptId,
        ).length;
        const activePlan = plans.find(
          (p) => p.status === 'active' && p.sessions.some((sess) => sess.concept === conceptId),
        );
        const total = activePlan?.sessions.length ?? 0;
        const done = activePlan?.sessions.filter((sess) => sess.status === 'done').length ?? 0;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        const remainingMinutes =
          activePlan?.sessions
            .filter((sess) => sess.status !== 'done')
            .reduce((sum, sess) => sum + sess.durationMin, 0) ?? 0;
        // "Đang ôn": a goal with status 'active' AND an active (confirmed) plan in progress.
        const activeGoalForConcept = goals.find(
          (g) =>
            toConceptId(g.concept) === conceptId &&
            (g.status ?? 'active') === 'active',
        );
        const status: CourseStatus =
          !activePlan || !activeGoalForConcept ? 'upcoming' : percent >= 100 ? 'done' : 'active';
        return {
          subject: s,
          conceptId,
          isCustom,
          name: concept?.name ?? s.customTitle ?? 'Môn học',
          description: concept?.description ?? s.customDescription,
          status,
          percent,
          remainingLessons: total - done,
          remainingMinutes,
          goalCount,
          planTitle: activePlan?.title,
          activeGoal: activeGoalForConcept
            ? {
                examName: activeGoalForConcept.examName,
                targetScore: activeGoalForConcept.targetScore,
                daysLeft: Math.ceil(
                  (new Date(activeGoalForConcept.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                ),
              }
            : undefined,
        };
      }),
    [allSubjects, goals, plans],
  );

  const selectedSubjectId = useSubjectStore((s) => s.selectedSubjectId);

  const filtered = useMemo(() => {
    let items = cards;
    if (selectedSubjectId) items = items.filter((c) => c.conceptId === selectedSubjectId);
    if (tab !== 'all') items = items.filter((c) => c.status === tab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q));
    }
    return [...items].sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name, 'vi')
        : b.subject.createdAt.localeCompare(a.subject.createdAt),
    );
  }, [cards, selectedSubjectId, tab, search, sort]);

  const activeCount = cards.filter((c) => c.status === 'active').length;
  const doneCount = cards.filter((c) => c.status === 'done').length;
  const withPlan = cards.filter((c) => !!c.planTitle);
  const avgCompletion = withPlan.length
    ? Math.round(withPlan.reduce((sum, c) => sum + c.percent, 0) / withPlan.length)
    : 0;
  const totalSessionsDone = plans
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + p.sessions.filter((sess) => sess.status === 'done').length, 0);

  const conceptNameById = useMemo(() => new Map(cards.map((c) => [c.conceptId, c.name])), [cards]);

  // Course-specific "việc cần làm" list — real planned sessions + real goal deadlines merged into
  // one chronological to-do, not the Dashboard's month calendar or recent-activity widgets.
  type TodoItem = { id: string; title: string; subjectName: string; due: Date; dueLabel: string };
  const todos = useMemo<TodoItem[]>(() => {
    const now = new Date();
    const sessionTodos: TodoItem[] = plans
      .filter((p) => p.status === 'active')
      .flatMap((p) =>
        p.sessions
          .filter((sess) => sess.status === 'planned' && new Date(sess.startAt) >= now)
          .map((sess) => ({
            id: sess._id,
            title: `Hoàn thành buổi học: ${sess.title ?? conceptNameById.get(sess.concept) ?? 'Môn học'}`,
            subjectName: conceptNameById.get(sess.concept) ?? 'Môn học',
            due: new Date(sess.startAt),
            dueLabel: new Date(sess.startAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
            }),
          })),
      );
    const goalTodos: TodoItem[] = goals.map((g) => ({
      id: g._id,
      title: `Mục tiêu: ${g.title}`,
      subjectName:
        conceptNameById.get(toConceptId(g.concept) ?? '') ?? 'Môn học',
      due: new Date(g.deadline),
      dueLabel: new Date(g.deadline).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    }));
    return [...sessionTodos, ...goalTodos].sort((a, b) => a.due.getTime() - b.due.getTime()).slice(0, 5);
  }, [plans, goals, conceptNameById]);

  // Real overall-progress-over-time: mastery score history (real `at` timestamps from the
  // learning-history API), scoped to this student's enrolled subjects, forward-filled into evenly
  // spaced buckets and averaged across concepts — not per-course % values joined into a line.
  const enrolledConceptIds = useMemo(() => new Set(cards.map((c) => c.conceptId)), [cards]);
  const progressSeries = useMemo(() => {
    type Point = { at: number; score: number };
    const byConcept = new Map<string, Point[]>();
    (masteryReport ?? []).forEach((entry) => {
      const conceptId = toConceptId(entry.concept);
      if (!conceptId || !enrolledConceptIds.has(conceptId)) return;
      const points = entry.history
        .filter((h): h is typeof h & { at: string } => !!h.at)
        .map((h) => ({ at: new Date(h.at).getTime(), score: h.score }))
        .sort((a, b) => a.at - b.at);
      if (points.length) byConcept.set(conceptId, points);
    });

    const hasHistory = byConcept.size > 0;
    const rangeDays = Number(progressRange);
    const bucketDays = rangeDays <= 7 ? 1 : rangeDays <= 30 ? 7 : 14;
    const bucketCount = Math.round(rangeDays / bucketDays);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const points = Array.from({ length: bucketCount }, (_, i) => {
      const bucketEnd = new Date(now);
      bucketEnd.setDate(bucketEnd.getDate() - (bucketCount - 1 - i) * bucketDays);
      const ts = bucketEnd.getTime();

      const latestScores: number[] = [];
      byConcept.forEach((pts) => {
        const upToNow = pts.filter((p) => p.at <= ts);
        if (upToNow.length) latestScores.push(upToNow[upToNow.length - 1].score);
      });
      const avg = latestScores.length
        ? Math.round(latestScores.reduce((s, v) => s + v, 0) / latestScores.length)
        : null;

      return {
        label: bucketEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        percent: avg,
      };
    });

    return { hasHistory, points };
  }, [masteryReport, enrolledConceptIds, progressRange]);

  return (
    <AppShell
      menu={studentMenu}
      title="Khoá học của tôi"
      breadcrumb={['Trang chủ', 'Khoá học của tôi']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Môn học của tôi</h1>
          <p className="text-sm text-muted-foreground">Theo dõi tiến độ và quản lý các môn học của bạn.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setTrashOpen(true)}>
            <History className="h-4 w-4" /> Đã xóa gần đây
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`${PATHS.student.planner}?openGoal=1`)}>
            <Target className="h-4 w-4" /> Thiết lập mục tiêu ôn thi
          </Button>
          <AddSubjectMenu
            label="Thêm môn"
            onPickCatalog={() => setCatalogOpen(true)}
            onPickCustom={() => setCustomOpen(true)}
          />
        </div>
      </div>

      {openDraft && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-primary/30 bg-primary-soft p-3 text-sm">
          <span className="text-foreground">
            Nháp chưa hoàn tất: Mục tiêu "{openDraft.title || openDraft.examName || 'Chưa đặt tên'}" (đang
            ở bước {Math.min(openDraft.wizardStep ?? 1, 6)}/6)
          </span>
          <Button type="button" size="sm" onClick={() => navigate(`${PATHS.student.planner}?openGoal=1`)}>
            Tiếp tục thiết lập
          </Button>
        </div>
      )}

      {allSubjects.length > 0 && (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={GraduationCap}
            label="Môn học đang theo học"
            value={allSubjects.length}
            tone="blue"
          />
          <StatCard
            icon={CheckCircle2}
            label="Tỷ lệ hoàn thành trung bình"
            value={avgCompletion}
            suffix="%"
            tone="mint"
          />
          <StatCard icon={Clock} label="Buổi học đã hoàn thành" value={totalSessionsDone} tone="amber" />
        </div>
      )}

      {allSubjects.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <GraduationCap className="h-8 w-8" />
          </span>
          <h2 className="text-lg font-bold text-foreground">Chưa có môn học nào</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thêm một môn từ danh mục chung để bắt đầu đặt mục tiêu và xây lộ trình học tập.
          </p>
          <AddSubjectMenu
            label="Thêm môn đầu tiên"
            onPickCatalog={() => setCatalogOpen(true)}
            onPickCustom={() => setCustomOpen(true)}
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-control border border-border bg-muted/40 p-1">
              {(['all', 'active', 'done'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded-control px-3 py-1.5 text-sm font-medium transition-colors',
                    tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {TAB_LABEL[t]} ({t === 'all' ? cards.length : t === 'active' ? activeCount : doneCount})
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="relative w-full max-w-[200px]">
                <span className="sr-only">Tìm môn học</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm môn học..."
                  className="h-9 w-full rounded-control border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <GlobalSubjectFilter compact />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'newest' | 'name')}
                className="h-9 rounded-control border border-input bg-card px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="newest">Mới nhất</option>
                <option value="name">Tên A-Z</option>
              </select>
              <button
                type="button"
                onClick={() => setViewAll((v) => !v)}
                className="ml-1 text-sm font-medium text-primary hover:underline"
              >
                {viewAll ? 'Thu gọn' : 'Xem tất cả'} <span aria-hidden>→</span>
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Không có môn học nào khớp với bộ lọc hiện tại.
            </p>
          ) : viewAll ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c, i) => (
                <CourseCard
                  key={c.subject._id}
                  data={c}
                  tone={toneForIndex(i)}
                  onCta={() =>
                    c.goalCount === 0
                      ? navigate(`${PATHS.student.planner}?concept=${c.conceptId}`)
                      : c.status === 'active'
                        ? navigate(PATHS.student.today)
                        : navigate(PATHS.student.planner)
                  }
                  onViewRoadmap={() => navigate(PATHS.student.goalRoadmap)}
                  onRemove={() => setRemoving(c.subject)}
                  onEdit={() => setEditing(c.subject)}
                  onTogglePin={() => pinMutation.mutate({ id: c.subject._id, pinned: !c.subject.pinned })}
                  onMoveUp={() => moveSubject(c.subject, -1)}
                  onMoveDown={() => moveSubject(c.subject, 1)}
                  canMoveUp={allSubjects.findIndex((s) => s._id === c.subject._id) > 0}
                  canMoveDown={allSubjects.findIndex((s) => s._id === c.subject._id) < allSubjects.length - 1}
                />
              ))}
            </div>
          ) : (
            <CourseCarousel
              items={filtered}
              renderItem={(c, i) => (
                <CourseCard
                  key={c.subject._id}
                  data={c}
                  tone={toneForIndex(i)}
                  onCta={() =>
                    c.goalCount === 0
                      ? navigate(`${PATHS.student.planner}?concept=${c.conceptId}`)
                      : c.status === 'active'
                        ? navigate(PATHS.student.today)
                        : navigate(PATHS.student.planner)
                  }
                  onViewRoadmap={() => navigate(PATHS.student.goalRoadmap)}
                  onRemove={() => setRemoving(c.subject)}
                  onEdit={() => setEditing(c.subject)}
                  onTogglePin={() => pinMutation.mutate({ id: c.subject._id, pinned: !c.subject.pinned })}
                  onMoveUp={() => moveSubject(c.subject, -1)}
                  onMoveDown={() => moveSubject(c.subject, 1)}
                  canMoveUp={allSubjects.findIndex((s) => s._id === c.subject._id) > 0}
                  canMoveDown={allSubjects.findIndex((s) => s._id === c.subject._id) < allSubjects.length - 1}
                />
              )}
            />
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.35fr]">
            <div className="flex flex-col rounded-card border border-border bg-card p-5 shadow-card">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">Tiến độ học tập</h3>
                  <p className="text-xs text-muted-foreground">Tỷ lệ hoàn thành trung bình theo thời gian</p>
                </div>
                <Select value={progressRange} onValueChange={(v) => setProgressRange(v as '7' | '30' | '90')}>
                  <SelectTrigger className="h-8 w-[104px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="tw-scope">
                    <SelectItem value="7">7 ngày</SelectItem>
                    <SelectItem value="30">30 ngày</SelectItem>
                    <SelectItem value="90">90 ngày</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!progressSeries.hasHistory ? (
                <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Chưa có lịch sử tiến độ học tập nào được ghi nhận trong khoảng thời gian này.
                  </p>
                </div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={progressSeries.points}
                      margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [value == null ? '—' : `${value}%`, 'Hoàn thành']}
                        labelFormatter={(label) => `Ngày ${label}`}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--card)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percent"
                        name="Hoàn thành"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-card border border-border bg-card p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Việc cần làm sắp tới</h3>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{todos.length} đầu việc</span>
              </div>
              {todos.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chưa có buổi học hay mục tiêu nào sắp tới.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {todos.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-control bg-muted/40 px-3.5 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{t.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{t.subjectName}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
                        Hạn {t.dueLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <CatalogSubjectDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        excludeIds={allSubjects
          .map((s) => toConceptId(s.concept))
          .filter((id): id is string => !!id)}
        onAdded={invalidate}
      />
      <CustomSubjectDialog open={customOpen} onOpenChange={setCustomOpen} onAdded={invalidate} />
      <EditSubjectDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        subject={editing}
        onSaved={invalidate}
      />
      <TrashDialog open={trashOpen} onOpenChange={setTrashOpen} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Bỏ môn học?"
        description="Mục tiêu và lộ trình liên quan tới môn này sẽ vẫn được giữ nguyên, chỉ ẩn khỏi danh sách này."
        onConfirm={() => removing && removeMutation.mutate(removing._id)}
      />
    </AppShell>
  );
}
