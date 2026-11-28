import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, Check, ChevronDown, RefreshCw, Search, X } from 'lucide-react';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { getSubjectId, getSubjectLabel } from '@/lib/subjectUtils';
import { cn } from '@/lib/utils';
import { PATHS } from '@/routes/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface GlobalSubjectFilterProps {
  /** Whether the "Tất cả môn học" option is available. Set false on pages that require a single subject (e.g. KnowledgeMap). */
  allowAll?: boolean;
  /** Compact inline dropdown mode without the outer card wrapper. */
  compact?: boolean;
  /** Optional explicit value override when a page needs to coordinate with URL params. */
  value?: string | null;
  /** Optional callback invoked when the user picks a subject. */
  onChange?: (subjectId: string | null) => void;
  className?: string;
}

export function GlobalSubjectFilter({
  allowAll = true,
  compact = false,
  value,
  onChange,
  className,
}: GlobalSubjectFilterProps) {
  const {
    selectedSubjectId,
    setSelectedSubjectId,
    catalogSubjects,
    loading,
    error,
    reload,
  } = useSelectedSubject();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const activeId = value !== undefined ? value : selectedSubjectId;

  const activeSubject = useMemo(
    () => catalogSubjects.find((s) => getSubjectId(s) === activeId) ?? null,
    [catalogSubjects, activeId],
  );

  const filteredSubjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogSubjects;
    return catalogSubjects.filter((s) => getSubjectLabel(s).toLowerCase().includes(q));
  }, [catalogSubjects, search]);

  const handleSelect = (id: string | null) => {
    setSelectedSubjectId(id);
    onChange?.(id);
    setOpen(false);
    setSearch('');
  };

  if (error) {
    return (
      <div
        data-testid="global-subject-filter"
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 rounded-card border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive',
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Không tải được danh sách môn học: {error}</span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Thử lại
        </Button>
      </div>
    );
  }

  const dropdownNode =
    loading && catalogSubjects.length === 0 ? (
      <div className={cn('h-9 animate-pulse rounded-control bg-muted', compact ? 'w-44' : 'w-52')} />
    ) : catalogSubjects.length === 0 ? (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Chưa có môn học nào.</span>
        <Link to={PATHS.student.courses} className="font-medium text-primary hover:underline">
          Thêm môn học
        </Link>
      </div>
    ) : (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            data-testid="global-subject-filter-trigger"
            className={cn(
              'h-9 max-w-full justify-between gap-2 rounded-control border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted/50',
              compact ? 'min-w-[165px]' : 'min-w-[210px] bg-background sm:min-w-[250px]',
            )}
          >
            <span className="truncate">
              {activeSubject
                ? getSubjectLabel(activeSubject)
                : allowAll
                  ? 'Tất cả môn học'
                  : 'Chọn môn học'}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="tw-scope w-72 p-2">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm môn học..."
              className="h-9 pl-8 text-sm"
            />
          </div>
          <div className="max-h-60 space-y-0.5 overflow-y-auto">
            {allowAll && (
              <button
                type="button"
                data-testid="global-subject-option-all"
                onClick={() => handleSelect(null)}
                className={cn(
                  'flex w-full items-center justify-between rounded-control px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted',
                  activeId === null && 'bg-primary/10 font-semibold text-primary',
                )}
              >
                <span>Tất cả môn học</span>
                {activeId === null && <Check className="h-4 w-4 shrink-0" />}
              </button>
            )}
            {filteredSubjects.length === 0 ? (
              <div className="px-2.5 py-4 text-center text-xs text-muted-foreground">
                Không tìm thấy môn học phù hợp
              </div>
            ) : (
              filteredSubjects.map((subject) => {
                const id = getSubjectId(subject);
                if (!id) return null;
                const label = getSubjectLabel(subject);
                const isSelected = activeId === id;
                return (
                  <button
                    key={subject._id}
                    type="button"
                    data-testid={`global-subject-option-${id}`}
                    onClick={() => handleSelect(id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-control px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted',
                      isSelected && 'bg-primary/10 font-semibold text-primary',
                    )}
                  >
                    <span className="truncate">{label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    );

  if (compact) {
    return (
      <div data-testid="global-subject-filter" className={cn('inline-flex items-center gap-2', className)}>
        {dropdownNode}
      </div>
    );
  }

  return (
    <div
      data-testid="global-subject-filter"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card px-4 py-2.5 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>Môn học:</span>
        </span>

        {dropdownNode}

        {allowAll && activeId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSelect(null)}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Xem tất cả môn học"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Bỏ lọc
          </Button>
        )}
      </div>

      {activeSubject && (
        <span className="hidden text-xs text-muted-foreground md:inline">
          Đang lọc dữ liệu theo môn <strong className="text-foreground">{getSubjectLabel(activeSubject)}</strong>
        </span>
      )}
    </div>
  );
}

/** Standard compact pill wrapper matching the Mastery header filter (`[ 📖 Môn học: <Dropdown ▼> ]`). */
export function SubjectFilterPill({
  className,
  ...props
}: Omit<GlobalSubjectFilterProps, 'compact'>) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-card border border-border bg-card px-3 py-1.5 shadow-sm',
        className,
      )}
    >
      <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">Môn học:</span>
      <GlobalSubjectFilter compact {...props} />
    </div>
  );
}
