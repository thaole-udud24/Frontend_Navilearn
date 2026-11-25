import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';

/** The one "Thêm …" button every screen should use — same Plus icon, same icon size per
 * `size`, so a list of "Thêm mới/Thêm bộ thẻ/Thêm buổi học/…" buttons never hand-rolls its own
 * `<Button><Plus/>…</Button>` again. `children` is the label; everything else (variant, size,
 * onClick, disabled, className…) passes straight through to Button. */
const AddButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ type = 'button', size, className, children, ...props }, ref) => (
    <Button ref={ref} type={type} size={size} className={className} {...props}>
      <Plus className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {children}
    </Button>
  ),
);
AddButton.displayName = 'AddButton';

export { AddButton };
