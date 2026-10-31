'use client';
import { useRef, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { emojiFor } from '@/lib/client';

/** Photo carousel (scroll-snap) with dots, or an emoji placeholder when there is no photo. */
export default function ProductMedia({ p, arrows = false }: { p: PublicProduct; arrows?: boolean }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  if (!p.images.length) return <div className="card__ph" aria-hidden="true">{emojiFor(p)}</div>;
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth, behavior: 'smooth' });
  return (
    <>
      <div className="slides" ref={ref} onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {p.images.map((src, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={k === 0 ? p.name : ''} loading="lazy" decoding="async" draggable={false} />
        ))}
      </div>
      {p.images.length > 1 && <div className="dots">{p.images.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>}
      {arrows && p.images.length > 1 && (<>
        <button className="slides__arrow slides__arrow--l" onClick={() => go(-1)} aria-label="Précédent">‹</button>
        <button className="slides__arrow slides__arrow--r" onClick={() => go(1)} aria-label="Suivant">›</button>
      </>)}
    </>
  );
}
