import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, GraduationCap, PlayCircle, Sparkles } from 'lucide-react';

const ORBIT_DOTS = [
  { angle: 0, size: 7, duration: 10 },
  { angle: 140, size: 5, duration: 10 },
  { angle: 250, size: 6, duration: 10 },
];

/** Centered badge with a slow-spinning orbit ring, drifting satellite dots, two floating accent
 * badges and a soft breathing glow — a bit more "alive" than a single static icon. */
export function AuthIllustration() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex h-36 w-36 items-center justify-center" aria-hidden>
      {/* breathing glow behind everything */}
      {!reduced && (
        <motion.span
          className="absolute h-28 w-28 rounded-full bg-white/20 blur-xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* slow-spinning dashed orbit ring */}
      <motion.span
        className="absolute h-32 w-32 rounded-full border border-dashed border-white/30"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />

      {/* satellite dots gliding around the ring */}
      {!reduced &&
        ORBIT_DOTS.map((d, i) => (
          <motion.span
            key={i}
            className="absolute h-32 w-32"
            style={{ rotate: d.angle }}
            animate={{ rotate: d.angle + 360 }}
            transition={{ duration: d.duration, repeat: Infinity, ease: 'linear' }}
          >
            <span
              className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.7)]"
              style={{ width: d.size, height: d.size }}
            />
          </motion.span>
        ))}

      <span className="relative flex h-28 w-28 items-center justify-center rounded-2xl bg-white/20">
        <GraduationCap className="h-12 w-12 text-white" />
        <motion.span
          className="absolute -right-2 -top-2 text-white/90"
          animate={reduced ? undefined : { rotate: [0, 15, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="h-4 w-4" />
        </motion.span>
      </span>

      <motion.span
        className="absolute -right-4 -top-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg"
        animate={reduced ? undefined : { y: [0, -6, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PlayCircle className="h-5 w-5" />
      </motion.span>

      <motion.span
        className="absolute -bottom-3 -left-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg"
        animate={reduced ? undefined : { y: [0, 6, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      >
        <BarChart3 className="h-5 w-5" />
      </motion.span>
    </div>
  );
}
