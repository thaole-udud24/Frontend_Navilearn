import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, CalendarClock, ChevronDown, ListChecks } from 'lucide-react';
import { pickVariants, slideInLeft, slideInRight, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import type { PlanTemplateStep } from '@/services/plan-template/types';

/** Read-only branching preview of a plan template's steps — same zigzag-along-an-axis visual
 * language as the student-facing RoadmapTree, so every roadmap in the app reads the same way.
 * Each card expands on click to show the step's actual theory text and question list — the
 * summary badges alone only said "has theory" / "N questions", never what they were. */
export function TemplateStepTree({
  steps,
  questionTextById = {},
}: {
  steps: PlanTemplateStep[];
  /** Question id -> text, so the expanded step can show real question content instead of raw ids. */
  questionTextById?: Record<string, string>;
}) {
  const reduced = useReducedMotion();
  const containerVariants = pickVariants(!!reduced, staggerContainer);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có buổi học nào.</p>;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="relative py-2">
      <motion.div
        aria-hidden
        initial={reduced ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5 + steps.length * 0.08, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'top' }}
        className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-border via-border to-transparent"
      />

      <div className="flex flex-col gap-5">
        {steps.map((s, i) => {
          const isLeft = i % 2 === 0;
          return (
            <motion.div
              key={i}
              variants={pickVariants(!!reduced, isLeft ? slideInLeft : slideInRight)}
              className="relative grid grid-cols-[1fr_2rem_1fr] items-center gap-2"
            >
              <div className={isLeft ? 'flex justify-end' : 'col-start-3 flex justify-start'}>
                <div className="w-full max-w-sm rounded-card border border-border bg-card shadow-card">
                  <button
                    type="button"
                    onClick={() => setExpanded((cur) => (cur === i ? null : i))}
                    className="flex w-full flex-col p-3 text-left"
                    aria-expanded={expanded === i}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" /> Ngày {s.dayOffset}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{s.durationMin} phút</span>
                        {(s.theoryContent || (s.questions?.length ?? 0) > 0) && (
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 text-muted-foreground transition-transform',
                              expanded === i && 'rotate-180',
                            )}
                          />
                        )}
                      </div>
                    </div>
                    {s.note && <p className="mt-1 text-sm text-muted-foreground">{s.note}</p>}
                    {(s.theoryContent || (s.questions?.length ?? 0) > 0) && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {s.theoryContent && (
                          <span className="inline-flex items-center gap-1 rounded-badge bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                            <BookOpen className="h-3 w-3" /> Có lý thuyết
                          </span>
                        )}
                        {(s.questions?.length ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-badge bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            <ListChecks className="h-3 w-3" /> {s.questions!.length} câu trắc nghiệm
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                  {expanded === i && (s.theoryContent || (s.questions?.length ?? 0) > 0) && (
                    <div className="flex flex-col gap-2 border-t border-border p-3 text-sm">
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
                    </div>
                  )}
                </div>
              </div>

              <div className="col-start-2 flex items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
                  {i + 1}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
