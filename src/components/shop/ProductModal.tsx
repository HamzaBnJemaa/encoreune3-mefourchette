'use client';
import { useRef } from 'react';
import type { PublicProduct } from '@/lib/types';
import { useSheet } from '@/hooks/useSheet';
import { useBodyLock } from '@/hooks/useBodyLock';
import { pct } from '@/lib/client';
import ProductMedia from './ProductMedia';
import { PriceView, Qty } from './ProductCard';

type Props = { product: PublicProduct | null; qty: number; setQty: (id: string, q: number) => void; onAdd: (el: HTMLElement, p: PublicProduct) => void; onClose: () => void; onGoCart: () => void };

export default function ProductModal({ product, qty, setQty, onAdd, onClose, onGoCart }: Props) {
  const { mounted, on } = useSheet(!!product);
  useBodyLock(!!product);
  // keep the last product rendered while the sheet animates out
  const last = useRef<PublicProduct | null>(null);
  if (product) last.current = product;
  const p = product ?? last.current;
  if (!mounted) return null;
  return (
    <>
      <div className={`overlay${on ? ' is-on' : ''}`} onClick={onClose} />
      <section className={`pmodal${on ? ' is-on' : ''}`} role="dialog" aria-modal="true" aria-labelledby="pmTitle" data-lenis-prevent>
        <button className="iconbtn pmodal__close" onClick={onClose} aria-label="Fermer">✕</button>
        {p && (<>
          <div className="pmodal__media">
            {p.salePrice != null && p.available && <span className="badge">-{pct(p)}%</span>}
            <ProductMedia p={p} arrows />
          </div>
          <div className="pmodal__body">
            <span className="card__cat">{p.category}</span>
            <h2 className="display" id="pmTitle">{p.name}</h2>
            <PriceView p={p} />
            {p.description && <p className="desc">{p.description}</p>}
            <div className="pmodal__act">
              {!p.available ? <span className="badge badge--out" style={{ position: 'static' }}>Épuisé</span>
                : qty ? (<>
                  <Qty p={p} qty={qty} setQty={setQty} onAdd={(el) => onAdd(el, p)} />
                  <button className="btn btn--amber" onClick={onGoCart}>Voir mon panier</button>
                </>) : <button className="btn btn--lg" onClick={(e) => { setQty(p.id, 1); onAdd(e.currentTarget, p); }}>Ajouter au panier</button>}
            </div>
          </div>
        </>)}
      </section>
    </>
  );
}
