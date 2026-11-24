import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepState = 'completed' | 'current' | 'locked';

export interface StepperStep {
  key: string;
  label: string;
  state: StepState;
}

/** Horizontal step indicator for a multi-step flow — current/completed/locked are distinguished by
 * both color AND icon (never color alone), per the design system's accessibility rule. Purely
 * presentational: pair it with whatever drives the actual step content (e.g. Radix `Tabs`, kept
 * controlled from the outside via `value`/`onValueChange`, with this component standing in for its
 * `TabsList`). */
export function Stepper({
  steps,
  onSelect,
  className,
}: {
  steps: StepperStep[];
  onSelect?: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <button
            type="button"
            disabled={s.state === 'locked'}
            onClick={() => onSelect?.(s.key)}
            aria-current={s.state === 'current' ? 'step' : undefined}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-control px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              s.state === 'current' && 'bg-primary text-primary-foreground shadow-card',
              s.state === 'completed' && 'text-success hover:bg-success/10',
              s.state === 'locked' && 'cursor-not-allowed text-muted-foreground/60',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                s.state === 'current' && 'bg-white/25 text-primary-foreground',
                s.state === 'completed' && 'bg-success text-white',
                s.state === 'locked' && 'bg-muted text-muted-foreground',
              )}
            >
              {s.state === 'completed' ? (
                <Check className="h-3 w-3" />
              ) : s.state === 'locked' ? (
                <Lock className="h-3 w-3" />
              ) : (
                i + 1
              )}
            </span>
            {s.label}
          </button>
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn('mx-1 h-px w-5 shrink-0', s.state === 'completed' ? 'bg-success' : 'bg-border')}
            />
          )}
        </div>
      ))}
    </div>
  );
}
