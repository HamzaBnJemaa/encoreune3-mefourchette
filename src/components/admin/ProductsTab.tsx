'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { api, emojiFor, jsonBody, money } from '@/lib/client';
import ProductEditor from './ProductEditor';

const DEFAULT_CATS = ['Viennoiseries', 'Pâtisseries', 'Salé', 'Traditionnel', 'Bocaux', 'Autres'];

export default function ProductsTab({ toast, onCount }: { toast: (m: string, t?: 'error') => void; onCount: (n: number) => void }) {
  const [products, setProducts] = useState<PublicProduct[] | null>(null);
  const [editing, setEditing] = useState<PublicProduct | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => { const p = await api<PublicProduct[]>('/api/admin/products'); setProducts(p); onCount(p.length); }, [onCount]);
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, [load, toast]);
  const cats = useMemo(() => [...new Set([...DEFAULT_CATS, ...(products || []).map((p) => p.category)])], [products]);
  const edit = (p: PublicProduct | null) => { setEditing(p); setOpen(true); };

  async function toggle(p: PublicProduct) {
    try { await api(`/api/admin/products/${p.id}`, jsonBody('PATCH', { available: !p.available })); await load(); toast(p.available ? 'Article masqué' : 'Article remis en vente'); } catch (e) { toast((e as Error).message, 'error'); }
  }
  async function del(p: PublicProduct) {
    if (!confirm(`Supprimer « ${p.name} » définitivement ?`)) return;
    try { await api(`/api/admin/products/${p.id}`, { method: 'DELETE' }); await load(); toast('Article supprimé'); } catch (e) { toast((e as Error).message, 'error'); }
  }
  async function seed() {
    try { await api('/api/admin/seed', { method: 'POST' }); await load(); toast('12 articles de démo ajoutés'); } catch (e) { toast((e as Error).message, 'error'); }
  }

  return (
    <section>
      <div className="bar"><h2 className="display">Mes articles</h2><button className="btn" onClick={() => edit(null)}>＋ Nouvel article</button></div>
      <div className="plist">
        {products && products.length === 0 && (
          <div className="blank" style={{ gridColumn: '1/-1' }}>
            <div className="e">🧁</div><h3 className="display">Aucun article</h3><p>Ajoutez votre premier article avec une photo, un nom et un prix.</p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn" onClick={() => edit(null)}>＋ Nouvel article</button>
              <button className="btn btn--paper" onClick={seed}>Ajouter 12 articles de démo</button>
            </div>
          </div>
        )}
        {(products || []).map((p, i) => (
          <article key={p.id} className={`prow${p.available ? '' : ' is-off'}`} style={{ ['--i' as string]: i % 12 }}>
            <div className="prow__img">{p.images[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt="" loading="lazy" /> : emojiFor(p)}{p.images.length > 1 && <b>{p.images.length} 📷</b>}</div>
            <div className="prow__info">
              <span className="prow__cat">{p.category}</span>
              <h3 className="prow__name">{p.name}</h3>
              <div className="prow__price">{money(p.salePrice != null ? p.salePrice : p.price)}{p.salePrice != null && <><s>{money(p.price)}</s><span className="off">-{Math.round((1 - p.salePrice / p.price) * 100)}%</span></>}{p.unit && <span style={{ opacity: 0.6, fontWeight: 400 }}> · {p.unit}</span>}</div>
              <div className="prow__actions">
                <button className="mini" onClick={() => edit(p)}>Modifier</button>
                <button className={`mini${p.available ? ' mini--on' : ''}`} onClick={() => toggle(p)}>{p.available ? '● En vente' : '○ Masqué'}</button>
                <button className="mini mini--danger" aria-label={`Supprimer ${p.name}`} onClick={() => del(p)}>🗑</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <ProductEditor open={open} product={editing} categories={cats} onClose={() => setOpen(false)} onSaved={async (m) => { setOpen(false); await load(); toast(m); }} />
    </section>
  );
}
