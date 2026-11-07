// Shared Framer Motion variants/transitions for the dashboard shell + DataTablePage.
// Centralised per spec step 4 so AppShell and DataTablePage stay visually consistent.
import type { Transition, Variants } from 'framer-motion';

export const easeOut: Transition['ease'] = [0.22, 1, 0.36, 1];

export const fadeUpTransition: Transition = { duration: 0.25, ease: easeOut };

/** Entrance: fade + slide up 12px. Use with a reduced-motion fallback via useReducedMotion(). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: fadeUpTransition },
};

/** Same as fadeUp but with no transform, for prefers-reduced-motion. */
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

/** Parent container: staggers children entrance by 40ms. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

export function pickVariants(reduced: boolean, variants: Variants): Variants {
  return reduced ? fadeOnly : variants;
}

/** Spring used by AuthPage's overlay-panel slide and entrance card (step 3 spec: 120/20). */
export const springTransition: Transition = { type: 'spring', stiffness: 120, damping: 20 };

/** Entrance: card flies up 40px, scale 0.96->1, spring. */
export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springTransition },
};

/** Entrance: logo "pop" via a snappier spring. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } },
};

/** Parent container for form fields: 70ms stagger per spec step 3. */
export const formStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

/** Form field entrance: slide 16px + fade. */
export const fieldSlideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: fadeUpTransition },
};

/** Text-reveal line: masked by overflow:hidden on the parent, slides up from under the mask. */
export const textLineReveal: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: '0%', opacity: 1, transition: { duration: 0.5, ease: easeOut } },
};

/** Shake used on full-form submit failure. */
export const shakeX: Variants = {
  initial: { x: 0 },
  shake: { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } },
};
