import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Maximize2, Minimize2, X } from 'lucide-react';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/** The one place a dialog's width is declared — no screen hardcodes its own `max-w-*` anymore.
 * `full` is a real fullscreen modal (section 3's "Fullscreen" size), not just a wide one. */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const DIALOG_SIZE_CLASS: Record<Exclude<DialogSize, 'full'>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const FULLSCREEN_CLASS =
  'inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-none translate-x-0 translate-y-0 overflow-y-auto';

/** What the "mở rộng" toggle always expands *to* — true edge-to-edge fullscreen, distinct from
 * `size="full"` (which still keeps a small inset) so the button stays meaningful even on an
 * already-full-size dialog. */
const TRUE_FULLSCREEN_CLASS =
  'inset-0 h-full w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0';

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize;
  /** Adds a "mở rộng" (expand-to-fullscreen) / "thu nhỏ" toggle next to the close (X) button.
   * Defaults to `true` — every dialog gets it unless a screen opts out (e.g. a 2-line confirm
   * prompt, via `expandable={false}`), per the design system's modal spec. */
  expandable?: boolean;
}

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, size = 'md', expandable = true, ...props }, ref) => {
    const [expanded, setExpanded] = React.useState(false);
    const ExpandIcon = expanded ? Minimize2 : Maximize2;

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-card duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-card',
            size === 'full' ? FULLSCREEN_CLASS : DIALOG_SIZE_CLASS[size],
            expanded && TRUE_FULLSCREEN_CLASS,
            className,
          )}
          {...props}
        >
          {children}
          {/* ── Window controls: expand toggle + close — separated with a gap so they never overlap ── */}
          <div className="absolute right-3 top-3 flex items-center gap-0.5">
            {expandable && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                title={expanded ? 'Thu nhỏ' : 'Mở rộng toàn màn hình'}
                aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng toàn màn hình'}
                className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <ExpandIcon className="h-4 w-4" />
              </button>
            )}
            <DialogPrimitive.Close
              title="Đóng"
              aria-label="Đóng"
              className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Đóng</span>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

/** The dialog's independently-scrolling middle region — put header and footer outside it so they
 * never scroll away. Requires the DialogContent itself to be a fixed-height flex column (e.g.
 * `size="xl"` + `className="flex max-h-[85vh] flex-col"`). The negative margin bleeds the scroll
 * track to the dialog's true edge instead of sitting inset by the body's own padding. */
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('-mx-6 min-h-0 flex-1 overflow-y-auto px-6', className)} {...props} />
);
DialogBody.displayName = 'DialogBody';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex shrink-0 flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex shrink-0 flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
