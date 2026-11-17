'use client';
import { useEffect, useRef } from 'react';

/** Lightweight animated backdrop for the app: drifting embers over a red horizon, echoing the website's globe. */
export default function Ambient() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const pts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, s: Math.random() * 0.00025 + 0.00006, a: Math.random() * 0.5 + 0.15, red: Math.random() < 0.25 }));
    const size = () => {
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    addEventListener('resize', size);
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (!reduce) {
          p.y -= p.s * 16;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        }
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.red ? `rgba(255,40,52,${p.a})` : `rgba(220,220,220,${p.a * 0.6})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) draw();
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', size);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);
  return (
    <div className="ambient" aria-hidden="true">
      <div className="amb-grid" />
      <div className="amb-horizon" />
      <canvas ref={ref} />
    </div>
  );
}
