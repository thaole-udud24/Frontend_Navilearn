import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { DialogFooter, DialogTitle } from '@/components/ui/dialog';
import type { StatTone } from '@/components/StatCard';
import { cn } from '@/lib/utils';

/** Icon + text, consistent across every Thêm mới/Chỉnh sửa/Chi tiết dialog in the admin area. */
export function FormDialogTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <DialogTitle className="flex items-center gap-2.5 text-lg">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </DialogTitle>
  );
}

const HEADER_TONE_CLASS: Record<StatTone, string> = {
  blue: 'from-primary-soft to-card text-primary',
  peach: 'from-accent-soft to-card text-accent',
  mint: 'from-mint/40 to-card text-mint-foreground',
  blush: 'from-blush/50 to-card text-blush-foreground',
  lavender: 'from-lavender/60 to-card text-lavender-foreground',
  amber: 'from-amber/50 to-card text-amber-foreground',
  teal: 'from-teal/40 to-card text-teal-foreground',
};

/** A colour-blocked banner for a form dialog's header — "phân lớp màu" per the design brief,
 * instead of a plain white title. Sits above the dialog's own content, offset by the content's
 * `p-6`/`gap-4` so it reads as one continuous panel rather than a card nested in a card. */
export function DialogColorHeader({
  icon: Icon,
  tone,
  title,
  description,
  trailing,
}: {
  icon: LucideIcon;
  tone: StatTone;
  title: ReactNode;
  description?: ReactNode;
  /** Extra content pinned to the right of the title (e.g. a status badge). */
  trailing?: ReactNode;
}) {
  return (
    <div
      className={cn(
        '-mx-6 -mt-6 flex items-center gap-3 rounded-t-card bg-gradient-to-br px-6 py-5',
        HEADER_TONE_CLASS[tone],
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-card">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <DialogTitle className="text-lg text-foreground">{title}</DialogTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {trailing && <div className="mr-8 shrink-0">{trailing}</div>}
    </div>
  );
}

/** Label-above-input field, with a red asterisk for required fields — mirrors the reference layout. */
export function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-sm font-medium text-foreground', className)}>
      <span>
        {required && <span className="text-danger">* </span>}
        {label}
      </span>
      {children}
    </label>
  );
}

/** One label/value row inside a Chi tiết (view) dialog — consistent spacing/typography everywhere. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}

/** Hủy (outline, left) + primary action (right) — the one footer shape every form dialog uses. */
export function FormDialogFooter({
  onCancel,
  submitLabel,
  onSubmit,
  submitting,
  disabled,
}: {
  onCancel: () => void;
  submitLabel: string;
  onSubmit: () => void;
  submitting?: boolean;
  disabled?: boolean;
}) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Hủy
      </Button>
      <Button type="button" onClick={onSubmit} disabled={submitting || disabled}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </DialogFooter>
  );
}
