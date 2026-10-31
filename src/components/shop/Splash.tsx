'use client';
import { useEffect, useState } from 'react';

export default function Splash() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => { document.documentElement.classList.add('is-ready'); setDone(true); setTimeout(() => setGone(true), 1300); };
    const min = new Promise<void>((r) => setTimeout(r, reduce ? 0 : 1300));
    const loaded = new Promise<void>((r) => { if (document.readyState === 'complete') r(); else addEventListener('load', () => r(), { once: true }); });
    Promise.all([min, loaded]).then(finish);
    const t = setTimeout(finish, 4000);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className={`splash${done ? ' is-done' : ''}`} aria-hidden="true">
      <div className="splash__word display"><span>Encore</span><span>une 3ème</span><span>fourchette</span></div>
    </div>
  );
}
