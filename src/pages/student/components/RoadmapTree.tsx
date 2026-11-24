import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Circle,
  ListChecks,
  Lock,
  Trash2,
  XCircle,
} from 'lucide-react';
import { pickVariants, slideInLeft, slideInRight, staggerContainer } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import type { PlanSession, SessionStatus } from '@/services/planning/types';

interface RoadmapTreeProps {
  sessions: PlanSession[];
  /** Preview mode (e.g. a proposed plan not yet confirmed) — no action buttons. */
  readOnly?: boolean;
  onSessionAction?: (action: { type: 'done' | 'cancel' | 'remove'; sessionId: string }) => void;
  /** A session with attached questions routes "Hoàn thành" here instead (UC-PLN-TPL-03): the quiz
   * must be passed first. Omit when the caller doesn't support the quiz step (e.g. admin preview). */
  onStartQuiz?: (sessionId: string) => void;
}

const STATUS_STYLE: Record<SessionStatus, { card: string; dot: string; icon: typeof Circle; label: string }> =
  {
    done: {
      card: 'border-success/40 bg-success/5',
      dot: 'bg-success text-white',
      icon: CheckCircle2,
      label: 'Hoàn thành',
    },
    planned: {
      card: 'border-border bg-card',
      dot: 'bg-primary text-primary-foreground',
      icon: Circle,
      label: 'Sắp tới',
    },
    missed: {
      card: 'border-danger/40 bg-danger/5',
      dot: 'bg-danger text-white',
      icon: AlertTriangle,
      label: 'Trễ hẹn',
    },
    cancelled: {
      card: 'border-border bg-muted/40 opacity-70',
      dot: 'bg-muted-foreground text-background',
      icon: XCircle,
      label: 'Đã hủy',
    },
  };

// Chặng (stage) lock state wins over the raw session status for display — a 'planned' session that
// is still 'locked' shows as locked, not as "Sắp tới". The BE also rejects completing/quizzing a
// locked session, so this is a label, not the only guard.
const LOCKED_STYLE = {
  card: 'border-border bg-muted/30 opacity-70',
  dot: 'bg-muted-foreground text-background',
  icon: Lock,
  label: 'Cần hoàn thành buổi trước',
};

/** Zigzag roadmap: sessions alternate left/right along a central axis, connected by one line
 * that draws in on mount — the "cây lộ trình" the student picks a goal's plan from (manual/AI/mẫu). */
export function RoadmapTree({ sessions, readOnly = false, onSessionAction, onStartQuiz }: RoadmapTreeProps) {
  const reduced = useReducedMotion();
  const [expandedTheory, setExpandedTheory] = useState<Set<string>>(new Set());
  const toggleTheory = (id: string) =>
    setExpandedTheory((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const ordered = [...sessions].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const containerVariants = pickVariants(!!reduced, staggerContainer);

  if (ordered.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có buổi học nào trong lộ trình này.</p>;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="relative py-2">
      <motion.div
        aria-hidden
        initial={reduced ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5 + ordered.length * 0.08, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'top' }}
        className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-border via-border to-transparent"
      />

      <div className="flex flex-col gap-6">
        {ordered.map((s, i) => {
          const isLocked = s.stageStatus === 'locked';
          const style = isLocked ? LOCKED_STYLE : STATUS_STYLE[s.status];
          const Icon = style.icon;
          const isLeft = i % 2 === 0;
          const start = new Date(s.startAt);

          return (
            <motion.div
              key={s._id}
              variants={pickVariants(!!reduced, isLeft ? slideInLeft : slideInRight)}
              className="relative grid grid-cols-[1fr_2rem_1fr] items-center gap-2"
            >
              <div className={isLeft ? 'flex justify-end' : 'col-start-3 flex justify-start'}>
                <div className={`w-full max-w-sm rounded-card border p-3 shadow-card ${style.card}`}>
                  <p className="text-sm font-semibold text-foreground">
                    {s.title ?? s.note ?? 'Buổi học'}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {start.toLocaleDateString('vi-VN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                      {' • '}
                      {start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.durationMin} phút</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    {isLocked && <Lock className="h-3 w-3" />} {style.label}
                  </p>
                  {(s.objectives?.length ?? 0) > 0 && (
                    <div className="mt-1.5">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Sau buổi này bạn có thể
                      </p>
                      <ul className="mt-0.5 flex flex-col gap-0.5">
                        {s.objectives!.map((o, idx) => (
                          <li key={idx} className="text-xs text-foreground">
                            • {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!isLocked && (s.theoryContent || (s.questions?.length ?? 0) > 0) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {s.theoryContent && (
                        <button
                          type="button"
                          onClick={() => toggleTheory(s._id)}
                          className="inline-flex items-center gap-1 rounded-badge bg-info/10 px-2 py-0.5 text-xs font-medium text-info hover:bg-info/20"
                        >
                          <BookOpen className="h-3 w-3" />{' '}
                          {expandedTheory.has(s._id) ? 'Ẩn lý thuyết' : 'Xem lý thuyết'}
                        </button>
                      )}
                      {(s.questions?.length ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-badge bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <ListChecks className="h-3 w-3" /> {s.questions!.length} câu trắc nghiệm
                          {s.quizPassed ? ' • đã đạt' : ''}
                        </span>
                      )}
                    </div>
                  )}
                  {s.theoryContent && expandedTheory.has(s._id) && (
                    <TheoryBlockViewer
                      raw={s.theoryContent}
                      className="mt-1.5 rounded-control bg-info/5 p-2"
                    />
                  )}
                  {s.status === 'done' && s.note && (
                    <p className="mt-1.5 text-xs text-muted-foreground">Ghi chú: {s.note}</p>
                  )}

                  {!isLocked && !readOnly && s.status === 'planned' && onSessionAction && (
                    <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
                      {(s.questions?.length ?? 0) > 0 && !s.quizPassed ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => onStartQuiz?.(s._id)}>
                          Làm trắc nghiệm để hoàn thành
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onSessionAction({ type: 'done', sessionId: s._id })}
                        >
                          Hoàn thành
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSessionAction({ type: 'cancel', sessionId: s._id })}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSessionAction({ type: 'remove', sessionId: s._id })}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-start-2 flex items-center justify-center">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${style.dot} ring-4 ring-background`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
