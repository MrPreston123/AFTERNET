'use client';
import { useEffect, useRef } from 'react';
import { PRESETS, sceneState } from '@/lib/scene-state';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Calls `cb(progress)` every frame while a tall pinned section scrolls past (0 at its top, 1 at its end). */
export function usePinProgress(cb: (p: number) => void) {
  const ref = useRef<HTMLElement>(null);
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
        if (Math.abs(p - last) > 0.0004) {
          last = p;
          cbRef.current(p);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return ref;
}

/** Moves the globe between per-section presets as you scroll, plus smooth scrolling and reveal animations. */
export function useScrollDirector() {
  useEffect(() => {
    let raf = 0;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!location.hash) scrollTo(0, 0);
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
    const tick = () => {
      const mid = innerHeight * 0.5;
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) {
          const a = PRESETS[els[i].dataset.scene!] ?? PRESETS.hero;
          const nextEl = els[i + 1];
          const b = nextEl ? PRESETS[nextEl.dataset.scene!] ?? a : a;
          const local = clamp((mid - r.top) / r.height);
          const t = smooth(range(local, 0.7, 1));
          sceneState.x = a.x + (b.x - a.x) * t;
          sceneState.y = a.y + (b.y - a.y) * t;
          sceneState.scale = a.scale + (b.scale - a.scale) * t;
          sceneState.dim = a.dim + (b.dim - a.dim) * t;
          break;
        }
      }
      // On narrow screens keep the globe centred behind content.
      if (innerWidth < 760) sceneState.x *= 0.15;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let lenis: { raf: (t: number) => void; destroy: () => void; on: (e: string, f: () => void) => void } | null = null;
    let lraf = 0;
    const cleanups: (() => void)[] = [];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')]);
      gsap.registerPlugin(ScrollTrigger);
      if (!reduce) {
        lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 }) as unknown as typeof lenis;
        lenis!.on('scroll', ScrollTrigger.update);
        (window as unknown as { __lenis: unknown }).__lenis = lenis;
        const loop = (t: number) => {
          lenis?.raf(t);
          lraf = requestAnimationFrame(loop);
        };
        lraf = requestAnimationFrame(loop);
        // in-page anchor links use Lenis
        const onClick = (e: MouseEvent) => {
          const a = (e.target as HTMLElement).closest('a[href^="/#"], a[href^="#"]') as HTMLAnchorElement | null;
          if (!a || location.pathname !== '/') return;
          const id = a.getAttribute('href')!.split('#')[1];
          const el = document.getElementById(id);
          if (!el) return;
          e.preventDefault();
          (lenis as unknown as { scrollTo: (el: Element, o?: object) => void }).scrollTo(el, { offset: -20, duration: 1.6 });
        };
        document.addEventListener('click', onClick);
        cleanups.push(() => document.removeEventListener('click', onClick));
      }
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.rv').forEach((el) => {
          gsap.fromTo(
            el,
            { y: reduce ? 0 : 40, opacity: 0, filter: reduce ? 'none' : 'blur(6px)' },
            { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', delay: Number(el.dataset.d ?? 0), scrollTrigger: { trigger: el, start: 'top 88%' } },
          );
        });
        gsap.utils.toArray<HTMLElement>('.split-words').forEach((el) => {
          const words = el.querySelectorAll('.w');
          gsap.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 85%' } });
        });
      });
      cleanups.push(() => ctx.revert());
    })();

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(lraf);
      lenis?.destroy();
      cleanups.forEach((f) => f());
    };
  }, []);
}

/** Wraps each word so it can slide up from a mask. */
export function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span className="wm"><span className="w">{w}</span></span>{' '}
        </span>
      ))}
    </>
  );
}
