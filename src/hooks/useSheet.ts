'use client';
import { useEffect, useState } from 'react';

/** Mount/unmount with enter + exit transitions: `on` toggles the .is-on class one frame after mount. */
export function useSheet(open: boolean, exitMs = 620) {
  const [mounted, setMounted] = useState(open);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
      return () => cancelAnimationFrame(id);
    }
    setOn(false);
    const t = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(t);
  }, [open, exitMs]);
  return { mounted, on };
}
