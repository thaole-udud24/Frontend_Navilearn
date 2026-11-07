import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Default tailwind-merge only recognizes stock theme scale values (e.g.
 * rounded-sm/lg/xl/full, shadow-sm/md/lg) when deciding which utilities
 * conflict. It does NOT know about this project's custom `@theme inline`
 * tokens (rounded-card/control/badge, shadow-card), so e.g.
 * `twMerge('rounded-control', 'rounded-full')` fails to dedupe them — both
 * end up in the className and whichever wins becomes a toss-up based on
 * generated CSS order instead of the intended override. Registering them
 * here fixes that for every `cn()` call across the app.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['card', 'control', 'badge'],
      shadow: ['card'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
