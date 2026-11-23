import { motion, useReducedMotion } from 'framer-motion';

interface TechGridOverlayProps {
  /** 'light' = sits on the ivory form panel (dark, low-opacity lines). 'dark' = sits on the blue
   * gradient panel (white, low-opacity lines). */
  variant?: 'light' | 'dark';
  className?: string;
}

const NODES = [
  { top: '14%', left: '82%', size: 5, delay: 0 },
  { top: '72%', left: '12%', size: 4, delay: 0.5 },
  { top: '40%', left: '90%', size: 3, delay: 1 },
  { top: '85%', left: '70%', size: 4, delay: 1.5 },
];

/**
 * A subtle "high-tech" decoration layer for the auth screen: a fine graph-paper grid, two
 * right-angle circuit traces in opposite corners, a couple of glowing square frames, one thin
 * orbit arc and a few pulsing nodes. Kept low-opacity and static-ish on purpose — it should read
 * as a premium tech texture, not a busy decoration.
 */
export function TechGridOverlay({ variant = 'light', className }: TechGridOverlayProps) {
  const reduced = useReducedMotion();
  const line = variant === 'dark' ? 'rgba(255,255,255,0.5)' : 'var(--primary)';
  const lineSoft = variant === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(78,136,217,0.14)';
  const nodeColor = variant === 'dark' ? '#ffffff' : 'var(--primary)';

  // One mask on the whole layer (grid + circuits + arc + squares + nodes together) carves out a
  // tall, narrow "hole" matching the form column, so nothing ever shows through a translucent
  // input — the texture only reads in the side margins, top and bottom, never behind the form.
  const safeZoneMask = 'radial-gradient(ellipse 34% 78% at 50% 50%, transparent 62%, black 100%)';

  return (
    <div
      className={className}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        maskImage: safeZoneMask,
        WebkitMaskImage: safeZoneMask,
      }}
    >
      {/* fine grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${lineSoft} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* circuit trace, top-left */}
      <svg className="absolute left-0 top-0 h-40 w-40 opacity-70" viewBox="0 0 160 160" fill="none">
        <path d="M0 40 H48 V12 H160" stroke={line} strokeOpacity="0.4" strokeWidth="1" />
        <path d="M0 80 H24 V96 H90" stroke={line} strokeOpacity="0.3" strokeWidth="1" />
        <circle cx="48" cy="12" r="2.5" fill={nodeColor} />
        <circle cx="24" cy="96" r="2" fill={nodeColor} />
      </svg>

      {/* circuit trace, bottom-right */}
      <svg className="absolute bottom-0 right-0 h-40 w-40 opacity-70" viewBox="0 0 160 160" fill="none">
        <path d="M160 120 H112 V148 H0" stroke={line} strokeOpacity="0.4" strokeWidth="1" />
        <path d="M160 80 H136 V64 H70" stroke={line} strokeOpacity="0.3" strokeWidth="1" />
        <circle cx="112" cy="148" r="2.5" fill={nodeColor} />
        <circle cx="136" cy="64" r="2" fill={nodeColor} />
      </svg>

      {/* thin orbit arc */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <ellipse
          cx="68"
          cy="60"
          rx="42"
          ry="34"
          fill="none"
          stroke={line}
          strokeOpacity="0.18"
          strokeWidth="0.25"
        />
      </svg>

      {/* glowing square frames */}
      <motion.span
        className="absolute h-14 w-14 rounded-md border"
        style={{ top: '22%', left: '8%', borderColor: lineSoft }}
        animate={reduced ? undefined : { opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute h-9 w-9 rounded-md border"
        style={{ bottom: '18%', right: '14%', borderColor: lineSoft }}
        animate={reduced ? undefined : { opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* pulsing nodes */}
      {!reduced &&
        NODES.map((n, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ top: n.top, left: n.left, width: n.size, height: n.size, background: nodeColor }}
            animate={{ opacity: [0.25, 1, 0.25], scale: [1, 1.4, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: n.delay }}
          />
        ))}
    </div>
  );
}
