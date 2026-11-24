import { useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, ChevronDown, Clock, ListChecks, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { theoryBlockCount } from '@/lib/theoryBlocks';
import { cn } from '@/lib/utils';
import type { PlanTemplateStep } from '@/services/plan-template/types';

function IconAction({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
            danger && 'hover:bg-danger/10 hover:text-danger',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="tw-scope">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function SessionItem({
  step,
  index,
  total,
  onUpdate,
  onMove,
  onRequestRemove,
  onEditTheory,
  onEditExercise,
}: {
  step: PlanTemplateStep;
  index: number;
  total: number;
  onUpdate: (patch: Partial<PlanTemplateStep>) => void;
  onMove: (dir: -1 | 1) => void;
  onRequestRemove: () => void;
  onEditTheory: () => void;
  onEditExercise: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasTheory = !!step.theoryContent;
  const questionCount = step.questions?.length ?? 0;

  return (
    <div
      className={cn('flex flex-col gap-2 rounded-control py-2.5', index > 0 && 'border-t border-border/70')}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {index + 1}
        </span>
        <Input
          value={step.title ?? ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder={`Tên buổi học ${index + 1} *`}
          className="h-9 flex-1 border-transparent bg-transparent px-1.5 font-medium shadow-none focus-visible:border-input focus-visible:bg-card"
        />
        <IconAction label="Chuyển lên" onClick={() => onMove(-1)} disabled={index === 0}>
          <ArrowUp className="h-3.5 w-3.5" />
        </IconAction>
        <IconAction label="Chuyển xuống" onClick={() => onMove(1)} disabled={index === total - 1}>
          <ArrowDown className="h-3.5 w-3.5" />
        </IconAction>
        <IconAction label="Xoá buổi học" onClick={onRequestRemove} disabled={total === 1} danger>
          <Trash2 className="h-3.5 w-3.5" />
        </IconAction>
        <button
          type="button"
          aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
          onClick={() => setExpanded((v) => !v)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-9">
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          Ngày
          <Input
            type="number"
            min={1}
            max={60}
            value={step.dayOffset}
            onChange={(e) => onUpdate({ dayOffset: Number(e.target.value) })}
            className="h-7 w-14 px-1.5 text-center"
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <Input
            type="number"
            min={5}
            max={480}
            value={step.durationMin}
            onChange={(e) => onUpdate({ durationMin: Number(e.target.value) })}
            className="h-7 w-16 px-1.5 text-center"
          />
          phút
        </label>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-badge px-2 py-0.5 text-xs font-medium',
            hasTheory ? 'bg-info/10 text-info' : 'bg-muted text-muted-foreground',
          )}
        >
          <BookOpen className="h-3 w-3" /> {theoryBlockCount(step.theoryContent)} khối lý thuyết
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-badge px-2 py-0.5 text-xs font-medium',
            questionCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <ListChecks className="h-3 w-3" /> {questionCount} câu
        </span>
      </div>

      {expanded && (
        <div className="flex gap-1.5 pl-9">
          <Button type="button" variant="outline" size="sm" onClick={onEditTheory}>
            <BookOpen className="h-3.5 w-3.5" /> Soạn lý thuyết
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onEditExercise}>
            <ListChecks className="h-3.5 w-3.5" /> Soạn bài tập
          </Button>
        </div>
      )}
    </div>
  );
}

/** Session Builder: the giai đoạn/buổi học list as a compact, scrollable item list instead of a
 * wide horizontal-scrolling table — the number badge carries sequence, the title is the one
 * prominent field, day/duration/badges stay in a secondary row, and the heavier "soạn nội
 * dung" actions only appear once a session is expanded (keeps a long roadmap scannable). */
export function SessionBuilder({
  steps,
  onUpdateStep,
  onMoveStep,
  onRequestRemoveStep,
  onEditTheory,
  onEditExercise,
}: {
  steps: PlanTemplateStep[];
  onUpdateStep: (index: number, patch: Partial<PlanTemplateStep>) => void;
  onMoveStep: (index: number, dir: -1 | 1) => void;
  onRequestRemoveStep: (index: number) => void;
  onEditTheory: (index: number) => void;
  onEditExercise: (index: number) => void;
}) {
  return (
    <TooltipProvider>
      <div className="flex flex-col">
        {steps.map((step, i) => (
          <SessionItem
            key={i}
            step={step}
            index={i}
            total={steps.length}
            onUpdate={(patch) => onUpdateStep(i, patch)}
            onMove={(dir) => onMoveStep(i, dir)}
            onRequestRemove={() => onRequestRemoveStep(i)}
            onEditTheory={() => onEditTheory(i)}
            onEditExercise={() => onEditExercise(i)}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
