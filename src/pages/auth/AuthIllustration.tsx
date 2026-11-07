import { motion } from 'framer-motion';
import { BarChart3, GraduationCap, PlayCircle } from 'lucide-react';

/** Centered badge + 2 small floating accent badges, matching the login/register overlay reference. */
export function AuthIllustration() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center" aria-hidden>
      <span className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white/20">
        <GraduationCap className="h-12 w-12 text-white" />
      </span>

      <motion.span
        className="absolute -right-4 -top-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PlayCircle className="h-5 w-5" />
      </motion.span>

      <motion.span
        className="absolute -bottom-3 -left-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <BarChart3 className="h-5 w-5" />
      </motion.span>
    </div>
  );
}
