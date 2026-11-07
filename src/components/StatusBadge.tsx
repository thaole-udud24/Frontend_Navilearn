import { cn } from '@/lib/utils';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const VARIANT_CLASS: Record<StatusBadgeVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  neutral: 'bg-muted-foreground/10 text-muted-foreground',
};

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

/** Status pill used across DataTablePage columns. Empty value renders the "Chưa cập nhật" placeholder. */
export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  if (children === undefined || children === null || children === '') {
    return <span className="text-xs italic text-muted-foreground/70">Chưa cập nhật</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-badge px-2 py-1 text-xs font-semibold',
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
