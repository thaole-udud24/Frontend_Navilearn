import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

interface SubmitButtonProps {
  label: string;
  status: SubmitStatus;
  className?: string;
}

/**
 * Main CTA for every auth form (spec step 6): gradient hover sweep, ripple from click point,
 * morphs into a circular spinner while submitting, then a check, then navigates away.
 * shortcut: hover-lift/press-scale use plain CSS (:hover/:active) instead of Framer
 * whileHover/whileTap — same visual result, far less JS; revisit only if these need to
 * interrupt/chain with other Framer animations later.
 */
export function SubmitButton({ label, status, className }: SubmitButtonProps) {
  const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number }[]>([]);
  const isMorphed = status === 'loading' || status === 'success';

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    window.setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={status === 'loading'}
      className={cn(
        'relative mx-auto flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r text-sm font-semibold text-primary-foreground shadow-md outline-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:hover:-translate-y-0',
        isMorphed ? 'w-14' : 'w-full',
        status === 'error' ? 'from-danger to-danger' : 'from-primary to-primary-hover',
        className,
      )}
    >
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 6, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ left: r.x, top: r.y }}
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60"
        />
      ))}

      <AnimatePresence mode="wait" initial={false}>
        {status === 'loading' ? (
          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className="h-5 w-5 animate-spin" />
          </motion.span>
        ) : status === 'success' ? (
          <motion.span
            key="success"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Check className="h-5 w-5" />
          </motion.span>
        ) : (
          <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            {label}
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
