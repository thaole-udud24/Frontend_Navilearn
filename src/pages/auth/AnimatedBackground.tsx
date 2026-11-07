import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  o: number;
}

/**
 * Lazy-loaded canvas particle layer (spec step 2/8): ~45 slow-floating dots.
 * Pauses its rAF loop while the tab is hidden. Parallax translation is applied by the
 * parent (AuthPage) via a Framer Motion wrapper, not by this component.
 */
export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const ctx2d = canvasEl?.getContext('2d');
    if (!canvasEl || !ctx2d) return;
    const canvas = canvasEl;
    const ctx = ctx2d;

    let raf = 0;
    let running = true;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      vy: Math.random() * 0.3 + 0.1,
      o: Math.random() * 0.4 + 0.1,
    }));

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y -= p.vy;
        if (p.y < -5) p.y = canvas.height + 5;
        ctx.beginPath();
        ctx.fillStyle = `rgba(11,58,130,${p.o})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    function handleVisibility() {
      running = document.visibilityState === 'visible';
      if (running) raf = requestAnimationFrame(tick);
      else cancelAnimationFrame(raf);
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
