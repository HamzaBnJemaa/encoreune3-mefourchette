'use client';
import { useCallback, useEffect, useRef } from 'react';

/** Lenis smooth scrolling (skipped for reduced-motion users). Returns a scrollTo helper. */
export function useSmoothScroll() {
  const lenis = useRef<import('lenis').default | null>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, alive = true;
    import('lenis').then(({ default: Lenis }) => {
      if (!alive) return;
      const l = new Lenis({ duration: 1.15, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      lenis.current = l;
      (window as unknown as { __lenis?: unknown }).__lenis = l;
      const loop = (t: number) => { l.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    });
    return () => { alive = false; cancelAnimationFrame(raf); lenis.current?.destroy(); lenis.current = null; delete (window as unknown as { __lenis?: unknown }).__lenis; };
  }, []);

  return useCallback((target: string | HTMLElement | number) => {
    const el = typeof target === 'string' ? (target === '#top' ? 0 : document.querySelector<HTMLElement>(target)) : target;
    if (el === null) return;
    const offset = -((document.getElementById('nav')?.offsetHeight ?? 68) - 2);
    if (lenis.current) lenis.current.scrollTo(el as HTMLElement | number, el === 0 ? { duration: 1.4 } : { offset, duration: 1.4 });
    else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: (el as HTMLElement).getBoundingClientRect().top + scrollY + offset, behavior: 'smooth' });
  }, []);
}
