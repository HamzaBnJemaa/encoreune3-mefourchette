'use client';
import { useEffect } from 'react';

/** Locks page scrolling while a sheet/drawer is open (works with Lenis too). */
export function useBodyLock(active: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (!active) return;
    root.classList.add('locked');
    (window as unknown as { __lenis?: { stop(): void } }).__lenis?.stop();
    return () => {
      root.classList.remove('locked');
      (window as unknown as { __lenis?: { start(): void } }).__lenis?.start();
    };
  }, [active]);
}
