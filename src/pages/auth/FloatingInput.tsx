import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  valid?: boolean;
  rightElement?: React.ReactNode;
}

/** Shared floating-label text input for every AuthPage form (spec step 6). */
export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    { label, icon: Icon, error, valid, rightElement, className, id, defaultValue, onFocus, onBlur, onChange, ...props },
    ref,
  ) => {
    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(Boolean(defaultValue));
    const floated = focused || hasValue;

    return (
      <div className="flex flex-col gap-1">
        <div className="relative">
          {Icon && (
            <span
              className={cn(
                'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors',
                focused ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <motion.span
                className="block"
                animate={{ scale: focused ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <Icon className="h-4 w-4" />
              </motion.span>
            </span>
          )}

          <input
            ref={ref}
            id={id}
            defaultValue={defaultValue}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            onChange={(e) => {
              setHasValue(e.target.value.length > 0);
              onChange?.(e);
            }}
            aria-invalid={Boolean(error)}
            className={cn(
              'flex h-14 w-full rounded-xl border bg-muted/60 px-4 pt-3 text-sm text-foreground outline-none transition-shadow',
              Icon ? 'pl-10' : 'pl-4',
              rightElement || valid ? 'pr-10' : 'pr-4',
              error ? 'border-danger' : 'border-primary/20',
              focused && !error && 'shadow-[0_0_0_3px_rgba(11,58,130,0.12)]',
              className,
            )}
            {...props}
          />

          <motion.label
            htmlFor={id}
            initial={false}
            animate={floated ? { y: -9, scale: 0.82 } : { y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'pointer-events-none absolute left-4 top-1/2 origin-left -translate-y-1/2 text-sm text-muted-foreground',
              Icon && 'left-10',
            )}
          >
            {label}
          </motion.label>

          <AnimatePresence>
            {valid && !error ? (
              <motion.span
                key="valid"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-success"
              >
                <Check className="h-4 w-4" />
              </motion.span>
            ) : rightElement ? (
              <span key="right" className="absolute right-4 top-1/2 -translate-y-1/2">
                {rightElement}
              </span>
            ) : null}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              role="alert"
              aria-live="polite"
              className="overflow-hidden text-xs text-danger"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
FloatingInput.displayName = 'FloatingInput';
