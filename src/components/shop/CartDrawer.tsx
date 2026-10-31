'use client';
import { useEffect, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { ApiError, api, emojiFor, jsonBody, money, priceOf, storage } from '@/lib/client';
import { useSheet } from '@/hooks/useSheet';
import { useBodyLock } from '@/hooks/useBodyLock';
import { confetti } from '@/lib/fx';

type Props = {
  open: boolean; onClose: () => void;
  products: PublicProduct[]; cart: Record<string, number>; setQty: (id: string, q: number) => void;
  subtotal: number; shipping: number; total: number; saving: number; onOrdered: () => void;
};
type Fields = { name: string; phone: string; address: string; note: string };
type Done = { id: string; total: number; name: string; phone: string };

export default function CartDrawer({ open, onClose, products, cart, setQty, subtotal, shipping, total, saving, onOrdered }: Props) {
  const { mounted, on } = useSheet(open);
  useBodyLock(open);
  const [view, setView] = useState<'cart' | 'form' | 'done'>('cart');
  const [f, setF] = useState<Fields>({ name: '', phone: '', address: '', note: '' });
  const [hp, setHp] = useState('');
  const [errs, setErrs] = useState<Partial<Record<keyof Fields, string>>>({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    if (open) {
      setView('cart'); setErrs({}); setFormErr('');
      const saved = storage.get<Partial<Fields>>('efs_customer', {});
      setF((x) => ({ ...x, name: saved.name || '', phone: saved.phone || '', address: saved.address || '' }));
    }
  }, [open]);

  const lines = Object.entries(cart).map(([id, q]) => ({ p: products.find((x) => x.id === id), q })).filter((l): l is { p: PublicProduct; q: number } => !!l.p);
  const upd = (k: keyof Fields) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fields = { name: f.name.trim(), phone: f.phone.trim(), address: f.address.trim() };
    const er: typeof errs = {};
    if (fields.name.length < 2) er.name = 'Indiquez votre nom.';
    const digits = fields.phone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) er.phone = 'Numéro invalide (8 chiffres minimum).';
    if (fields.address.length < 5) er.address = 'Indiquez votre adresse.';
    setErrs(er); setFormErr('');
    if (Object.keys(er).length) { document.getElementById(`f-${Object.keys(er)[0]}`)?.focus(); return; }
    setBusy(true);
    try {
      const items = lines.map(({ p, q }) => ({ id: p.id, qty: q }));
      const r = await api<{ id: string; total?: number }>('/api/orders', jsonBody('POST', { ...fields, note: f.note, website: hp, items }));
      storage.set('efs_customer', fields);
      setDone({ id: r.id, total: r.total ?? total, name: fields.name, phone: fields.phone });
      onOrdered(); setView('done'); confetti();
    } catch (ex) {
      if (ex instanceof ApiError && typeof ex.data.field === 'string') setErrs({ [ex.data.field]: ex.message });
      else setFormErr(ex instanceof ApiError ? ex.message : 'Connexion impossible. Vérifiez votre réseau et réessayez.');
    }
    setBusy(false);
  }

  if (!mounted) return null;
  const title = view === 'cart' ? 'Mon panier' : view === 'form' ? 'Votre commande' : 'Merci !';
  return (
    <>
      <div className={`overlay${on ? ' is-on' : ''}`} onClick={onClose} />
      <aside className={`drawer${on ? ' is-on' : ''}`} role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
        <header className="drawer__head">
          {view === 'form' && <button className="iconbtn" onClick={() => setView('cart')} aria-label="Retour">←</button>}
          <h2 className="display" id="drawerTitle">{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Fermer le panier">✕</button>
        </header>

        <div className="drawer__body" data-lenis-prevent>
          {view === 'cart' && (lines.length === 0 ? (
            <div className="cart-empty"><img className="cart-empty__img" src="/panier.png" alt="" /><h3 className="display">Panier vide</h3><p>Ajoutez quelques gourmandises, on ne dira rien.</p><button className="btn btn--amber" onClick={onClose}>Voir la carte</button></div>
          ) : (
            <ul className="lines">
              {lines.map(({ p, q }) => (
                <li className="line-item" key={p.id}>
                  <div className="line-item__img">{p.images[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.images[0]} alt="" /> : emojiFor(p)}</div>
                  <div className="line-item__info">
                    <div className="line-item__top">
                      <div><div className="line-item__name">{p.name}</div><div className="line-item__unit">{money(priceOf(p))}{p.unit ? ` · ${p.unit}` : ''}</div></div>
                      <button className="rm" onClick={() => setQty(p.id, 0)} aria-label={`Retirer ${p.name}`}>✕</button>
                    </div>
                    <div className="line-item__bot">
                      <div className="stepper"><button onClick={() => setQty(p.id, q - 1)} aria-label="Moins">−</button><output>{q}</output><button onClick={() => setQty(p.id, q + 1)} aria-label="Plus">+</button></div>
                      <span className="line-item__sum">{money(priceOf(p) * q)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ))}

          {view === 'form' && (
            <form className="form" id="orderForm" onSubmit={submit} noValidate>
              <div className="form__sum">
                {lines.map(({ p, q }) => <div key={p.id}><span>{q} × {p.name}</span><span>{money(priceOf(p) * q)}</span></div>)}
                <div><span>Livraison</span><span>{money(shipping)}</span></div>
                <div className="t"><span>Total</span><span>{money(total)}</span></div>
              </div>
              <div className={`field${errs.name ? ' is-error' : ''}`}><label htmlFor="f-name">Nom complet</label><input className="input" id="f-name" autoComplete="name" placeholder="Ex : Sarra Ben Ali" maxLength={80} value={f.name} onChange={upd('name')} /><span className="err">{errs.name}</span></div>
              <div className={`field${errs.phone ? ' is-error' : ''}`}><label htmlFor="f-phone">Téléphone</label><input className="input" id="f-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ex : 20 123 456" maxLength={30} value={f.phone} onChange={upd('phone')} /><span className="err">{errs.phone}</span></div>
              <div className={`field${errs.address ? ' is-error' : ''}`}><label htmlFor="f-address">Adresse de livraison</label><textarea className="textarea" id="f-address" autoComplete="street-address" placeholder="Rue, ville, repère…" maxLength={300} rows={3} value={f.address} onChange={upd('address')} /><span className="err">{errs.address}</span></div>
              <div className="field"><label htmlFor="f-note">Un petit mot ? <small style={{ textTransform: 'none', fontWeight: 500, opacity: 0.6 }}>(facultatif)</small></label><textarea className="textarea" id="f-note" placeholder="Horaire souhaité, allergie, étage…" maxLength={300} rows={2} value={f.note} onChange={upd('note')} /></div>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />
              {formErr && <div className="form__err">{formErr}</div>}
              <p className="form__note">Pas de compte à créer. Nous vous appelons pour confirmer la commande et le paiement.</p>
            </form>
          )}

          {view === 'done' && done && (
            <div className="done">
              <div className="done__check"><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#FFD54F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></div>
              <h3 className="display">Commande envoyée !</h3>
              <span className="code">{done.id}</span>
              <p>Merci {done.name.split(' ')[0]} ! Nous vous appelons très vite au <b>{done.phone}</b> pour confirmer. Total : <b>{money(done.total)}</b>.</p>
            </div>
          )}
        </div>

        <footer className="drawer__foot">
          {view === 'cart' && lines.length > 0 && (<>
            <div className="totalrow"><span>Sous-total</span><b>{money(subtotal)}</b></div>
            <div className="totalrow"><span>Livraison</span><b>{money(shipping)}</b></div>
            <div className="totalrow"><span>Total</span><b>{money(total)}</b></div>
            {saving > 0 && <div className="saving">Vous économisez {money(saving)} 🎉</div>}
            <button className="btn btn--lg btn--block" onClick={() => setView('form')}>Commander</button>
          </>)}
          {view === 'form' && (<>
            <div className="totalrow"><span>Livraison</span><b>{money(shipping)}</b></div>
            <div className="totalrow"><span>Total</span><b>{money(total)}</b></div>
            <button className="btn btn--lg btn--block" type="submit" form="orderForm" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer ma commande'}</button>
          </>)}
          {view === 'done' && <button className="btn btn--amber btn--lg btn--block" onClick={onClose}>Retour à la carte</button>}
        </footer>
      </aside>
    </>
  );
}
