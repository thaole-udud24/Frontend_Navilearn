import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers,
  ListChecks,
} from 'lucide-react';
import { pickVariants, fadeUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import type { PlanTemplateStep } from '@/services/plan-template/types';

export function isStepReady(step: PlanTemplateStep) {
  return !!step.theoryContent && (step.questions?.length ?? 0) > 0;
}

/**
 * Bản đồ lộ trình — zigzag two-sided timeline.
 *
 * Layout per row:  [ card-or-empty | 3rem axis column | card-or-empty ]
 *
 * - Even rows (i%2===0): card on LEFT,  right col empty.
 * - Odd  rows (i%2===1): card on RIGHT, left col empty.
 * - The node circle sits exactly on the vertical axis (center of the 3rem col).
 * - Day info lives INSIDE the card header — not as a floating caption.
 * - The vertical line is `position:absolute left-1/2` of the outer container,
 *   so it passes through the center of every node regardless of card height.
 */
export function TemplateStepTree({
  steps,
  questionTextById = {},
  onEditStage,
  filter = 'all',
}: {
  steps: PlanTemplateStep[];
  questionTextById?: Record<string, string>;
  onEditStage?: (index: number, tab: 'theory' | 'exercise') => void;
  filter?: 'all' | 'ready' | 'review';
}) {
  const reduced = useReducedMotion();
  const containerVariants = pickVariants(!!reduced, staggerContainer);
  const [expanded, setExpanded] = useState<number | null>(null);

  const visible = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => {
      if (filter === 'ready') return isStepReady(step);
      if (filter === 'review') return !isStepReady(step);
      return true;
    });

  if (steps.length === 0)
    return <p className="text-sm text-muted-foreground">Chưa có buổi học nào.</p>;
  if (visible.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Không có buổi học nào khớp với bộ lọc này.
      </p>
    );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative py-2"
    >
      {/* ── Vertical axis line — always centered, independent of row heights ── */}
      <motion.div
        aria-hidden
        initial={reduced ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4 + visible.length * 0.06, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'top' }}
        className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-border via-border to-transparent"
      />

      <div className="flex flex-col gap-6">
        {visible.map(({ step: s, index: i }) => {
          const isLeft = i % 2 === 0;
          const ready = isStepReady(s);
          const isExp = expanded === i;
          const hasDetail =
            !!s.theoryContent ||
            (s.questions?.length ?? 0) > 0 ||
            (s.objectives?.length ?? 0) > 0 ||
            !!onEditStage;

          /* ── Card ── */
          const card = (
            <div
              className={cn(
                'relative w-full max-w-xs overflow-hidden rounded-card border bg-card shadow-card transition-all hover:shadow-lg sm:max-w-sm',
                isExp
                  ? 'border-primary ring-1 ring-primary'
                  : ready
                    ? 'border-success/40'
                    : 'border-warning/40',
              )}
            >
              {/* Warning corner tag */}
              {!ready && (
                <span
                  aria-hidden
                  className="absolute right-2 top-0 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-warning/70"
                />
              )}

              {/* Clickable header area */}
              <button
                type="button"
                onClick={() => hasDetail && setExpanded((cur) => (cur === i ? null : i))}
                aria-expanded={isExp}
                className={cn(
                  'flex w-full flex-col gap-1.5 p-3 text-left',
                  hasDetail && 'cursor-pointer',
                )}
              >
                {/* Row 1: icon + "Buổi N · Ngày N" label + edit shortcut */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-control',
                      ready ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                  </span>

                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground">
                    Buổi {i + 1}
                    <span className="mx-1 text-muted-foreground/50">·</span>
                    <CalendarDays className="mb-0.5 mr-0.5 inline h-3 w-3" />
                    Ngày {s.dayOffset}
                  </span>

                  {onEditStage && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Soạn nội dung buổi học"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStage(i, 'theory');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          onEditStage(i, 'theory');
                        }
                      }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-primary"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>

                {/* Row 2: title */}
                <p className="break-words text-sm font-semibold leading-snug text-foreground">
                  {s.title}
                </p>

                {/* Row 3: ready / review badge */}
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  {ready ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3 w-3" /> Đủ học liệu
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-warning">
                      <AlertTriangle className="h-3 w-3" /> Chờ rà soát
                    </span>
                  )}
                </div>

                {/* Row 4: duration + questions */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {s.durationMin} phút
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ListChecks className="h-3 w-3" /> {s.questions?.length ?? 0} câu hỏi
                  </span>
                </div>
              </button>

              {/* Expanded detail panel */}
              {isExp && hasDetail && (
                <div className="flex flex-col gap-2 border-t border-border p-3 text-sm">
                  {(s.objectives?.length ?? 0) > 0 && (
                    <div>
                      <p className="mb-0.5 text-xs font-semibold uppercase text-muted-foreground">
                        Sau buổi này bạn có thể
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {s.objectives!.map((o, idx) => (
                          <li key={idx} className="text-foreground">
                            • {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {s.theoryContent && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Lý thuyết
                      </p>
                      <TheoryBlockViewer raw={s.theoryContent} />
                    </div>
                  )}
                  {(s.questions?.length ?? 0) > 0 && (
                    <div>
                      <p className="mb-0.5 text-xs font-semibold uppercase text-muted-foreground">
                        Câu hỏi ({s.questions!.length})
                      </p>
                      <ul className="flex flex-col gap-1">
                        {s.questions!.map((qId) => (
                          <li key={qId} className="text-foreground">
                            • {questionTextById[qId] ?? qId}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {onEditStage && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEditStage(i, 'theory')}
                      >
                        Soạn lý thuyết
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEditStage(i, 'exercise')}
                      >
                        Soạn bài tập
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );

          return (
            <motion.div
              key={i}
              variants={pickVariants(!!reduced, fadeUp)}
              /**
               * 3-col grid:
               *   col-1 (1fr)  — left card slot
               *   col-2 (3rem) — axis: node circle, vertically centered
               *   col-3 (1fr)  — right card slot
               *
               * `items-start` so tall expanded cards don't push the node down.
               * The vertical line is `absolute` on the outer wrapper so it stays
               * continuous through all row heights.
               */
              className="grid grid-cols-[1fr_3rem_1fr] items-start gap-x-0 gap-y-0"
            >
              {/* Left slot */}
              <div className={cn('flex', isLeft ? 'justify-end pr-4' : '')}>
                {isLeft ? card : null}
              </div>

              {/* Center — node circle, always vertically aligned to card top */}
              <div className="flex justify-center pt-3">
                <span
                  className={cn(
                    'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white',
                    ready
                      ? 'bg-success shadow-[0_0_0_3px_theme(colors.background),0_0_0_5px_theme(colors.success/0.5)]'
                      : 'bg-warning shadow-[0_0_0_3px_theme(colors.background),0_0_0_5px_theme(colors.warning/0.5)]',
                  )}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                >
                  {i + 1}
                </span>
              </div>

              {/* Right slot */}
              <div className={cn('flex', !isLeft ? 'justify-start pl-4' : '')}>
                {!isLeft ? card : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
