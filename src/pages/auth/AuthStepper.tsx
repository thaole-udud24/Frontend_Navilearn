import { Fragment } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface AuthStepperProps {
  currentStep: 1 | 2 | 3;
  labels: readonly [string, string, string];
  className?: string;
}

/** Small 3-step progress indicator used across ForgotPasswordView / OtpView / ResetPasswordView. */
export function AuthStepper({ currentStep, labels, className }: AuthStepperProps) {
  return (
    <div className={cn('flex w-full items-start', className)} aria-label="Tiến trình khôi phục mật khẩu">
      {labels.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const done = step < currentStep;
        const active = step === currentStep;
        return (
          <Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  done && 'bg-primary text-primary-foreground',
                  active && 'border-2 border-primary bg-card text-primary',
                  !done && !active && 'border border-border bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step}
              </span>
              <span
                className={cn(
                  'max-w-[76px] text-center text-[11px] leading-tight',
                  active ? 'font-medium text-primary' : done ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <span className={cn('mt-3.5 h-px flex-1 transition-colors', done ? 'bg-primary' : 'bg-border')} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
