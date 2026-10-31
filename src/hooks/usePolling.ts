'use client';
import { useEffect, useRef } from 'react';

/** Calls fn now and then every `ms` (paused while the tab is hidden). */
export function usePolling(fn: () => void | Promise<void>, ms: number) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    ref.current();
    const t = setInterval(() => { if (!document.hidden) ref.current(); }, ms);
    const vis = () => { if (!document.hidden) ref.current(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [ms]);
}
