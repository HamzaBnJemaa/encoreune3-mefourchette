'use client';
import { memo } from 'react';
import type { PublicProduct } from '@/lib/types';
import { emojiFor, money, pct, priceOf } from '@/lib/client';
import ProductMedia from './ProductMedia';

export function PriceView({ p, unit = true }: { p: PublicProduct; unit?: boolean }) {
  return (
    <div className={`price${p.salePrice != null ? ' is-sale' : ''}`}>
      <b>{money(priceOf(p))}</b>
      {p.salePrice != null && <s>{money(p.price)}</s>}
      {unit && p.unit && <small>{p.unit}</small>}
    </div>
  );
}

export function Qty({ p, qty, setQty, onAdd }: { p: PublicProduct; qty: number; setQty: (id: string, q: number) => void; onAdd: (el: HTMLElement) => void }) {
  if (!p.available) return <button className="add" disabled aria-label="Indisponible">–</button>;
  if (!qty) return <button className="add" aria-label={`Ajouter ${p.name} au panier`} onClick={(e) => { setQty(p.id, 1); onAdd(e.currentTarget); }}>+</button>;
  return (
    <div className="stepper">
      <button aria-label="Retirer un" onClick={() => setQty(p.id, qty - 1)}>−</button>
      <output>{qty}</output>
      <button aria-label="Ajouter un" onClick={(e) => { setQty(p.id, qty + 1); onAdd(e.currentTarget); }}>+</button>
    </div>
  );
}

type Props = { p: PublicProduct; index: number; qty: number; setQty: (id: string, q: number) => void; onOpen: (id: string) => void; onAdd: (el: HTMLElement, p: PublicProduct) => void };

function Card({ p, index, qty, setQty, onOpen, onAdd }: Props) {
  return (
    <article className={`card${p.available ? '' : ' is-soldout'}`} style={{ ['--d' as string]: index % 4 }}>
      <div className="card__media" role="button" tabIndex={0} aria-label={`Voir ${p.name}`} onClick={() => onOpen(p.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(p.id); } }}>
        {p.salePrice != null && p.available && <span className="badge">-{pct(p)}%</span>}
        {!p.available && <span className="badge badge--out">Épuisé</span>}
        <ProductMedia p={p} />
      </div>
      <div className="card__body">
        <span className="card__cat">{p.category}</span>
        <h3 className="card__title" onClick={() => onOpen(p.id)}>{p.name}</h3>
        {p.description && <p className="card__desc">{p.description}</p>}
        <div className="card__foot">
          <PriceView p={p} />
          <div className="card__act"><Qty p={p} qty={qty} setQty={setQty} onAdd={(el) => onAdd(el, p)} /></div>
        </div>
      </div>
    </article>
  );
}
export default memo(Card);
export { emojiFor };
