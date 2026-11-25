import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lifts slightly with a softer shadow on hover — for cards that are clickable or draw the eye. */
  interactive?: boolean;
}

/** The one base surface every dashboard card/widget/panel should sit on, so padding, radius,
 * border and shadow never drift between pages. Compose with CardHeader/CardTitle when a card
 * needs the common "title (+ optional trailing action)" row. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-card border border-border bg-card p-4 shadow-card',
        interactive &&
          'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(32,59,112,0.12)]',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-3 flex flex-wrap items-center justify-between gap-2', className)}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-semibold text-foreground', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';
