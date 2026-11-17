'use client';
import { useEffect, useRef } from 'react';

/** Tactical crosshair cursor with a live coordinate readout. Only on fine pointers (mouse / trackpad). */
export default function Crosshair() {
  const root = useRef<HTMLDivElement>(null);
  const read = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return;
    const el = root.current!;
    document.documentElement.classList.add('has-crosshair');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = '1';
      const t = e.target as HTMLElement | null;
      el.classList.toggle('is-hot', !!t?.closest('a,button,[role="button"],select,label,.hot'));
      el.classList.toggle('is-text', !!t?.closest('input,textarea'));
    };
    const down = () => el.classList.add('is-down');
    const up = () => el.classList.remove('is-down');
    const leave = () => (el.style.opacity = '0');
    const tick = () => {
      x += (tx - x) * 0.35;
      y += (ty - y) * 0.35;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (read.current) read.current.textContent = `X${String(Math.round(tx)).padStart(4, '0')} Y${String(Math.round(ty)).padStart(4, '0')}`;
      raf = requestAnimationFrame(tick);
    };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', down);
    addEventListener('pointerup', up);
    document.documentElement.addEventListener('pointerleave', leave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move);
      removeEventListener('pointerdown', down);
      removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.classList.remove('has-crosshair');
    };
  }, []);

  return (
    <div ref={root} className="xh" aria-hidden="true">
      <i className="xh-l xh-t" />
      <i className="xh-l xh-b" />
      <i className="xh-l xh-lf" />
      <i className="xh-l xh-r" />
      <i className="xh-ring" />
      <i className="xh-dot" />
      <span ref={read} className="xh-read" />
    </div>
  );
}
