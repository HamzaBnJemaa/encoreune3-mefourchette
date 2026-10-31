'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Order, PublicCourier } from '@/lib/types';
import { ApiError, api, dateTime, jsonBody, telDigits } from '@/lib/client';
import { Modal } from './ui';

type Props = { toast: (m: string, t?: 'error') => void };

export default function CouriersTab({ toast }: Props) {
  const [list, setList] = useState<PublicCourier[] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creating, setCreating] = useState(false);
  const [resetFor, setResetFor] = useState<PublicCourier | null>(null);
  const [u, setU] = useState(''); const [pw, setPw] = useState(''); const [errs, setErrs] = useState<{ username?: string; password?: string }>({}); const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [c, o] = await Promise.all([api<PublicCourier[]>('/api/admin/couriers'), api<Order[]>('/api/admin/orders')]);
    setList(c); setOrders(o);
  }, []);
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, [load, toast]);

  const stat = (id: string) => ({ done: orders.filter((o) => o.courier?.id === id && o.status === 'delivered').length, going: orders.filter((o) => o.courier?.id === id && o.status === 'on_the_way').length });

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrs({});
    try { await api('/api/admin/couriers', jsonBody('POST', { username: u, password: pw })); setCreating(false); setU(''); setPw(''); await load(); toast('Compte livreur créé ✓'); }
    catch (ex) { if (ex instanceof ApiError && typeof ex.data.field === 'string') setErrs({ [ex.data.field]: ex.message }); else toast((ex as Error).message, 'error'); }
    setBusy(false);
  }
  async function reset(e: React.FormEvent) {
    e.preventDefault(); if (!resetFor) return; setBusy(true); setErrs({});
    try { await api(`/api/admin/couriers/${resetFor.id}`, jsonBody('PATCH', { password: pw })); setResetFor(null); setPw(''); toast('Mot de passe modifié ✓'); }
    catch (ex) { setErrs({ password: (ex as Error).message }); }
    setBusy(false);
  }
  async function del(c: PublicCourier) {
    if (!confirm(`Supprimer le compte de ${c.name || c.username} ? Il ne pourra plus se connecter.`)) return;
    try { await api(`/api/admin/couriers/${c.id}`, { method: 'DELETE' }); await load(); toast('Compte supprimé'); } catch (e) { toast((e as Error).message, 'error'); }
  }

  return (
    <section>
      <div className="bar"><h2 className="display">Livreurs</h2><button className="btn" onClick={() => { setU(''); setPw(''); setErrs({}); setCreating(true); }}>＋ Nouveau livreur</button></div>
      <p className="helper" style={{ marginBottom: '1rem' }}>Créez un identifiant et un mot de passe, donnez-les au livreur : à sa première connexion (page <b>/livreur</b>) il remplit son nom et son téléphone. Il ne voit que les commandes, jamais les articles.</p>
      <div className="plist">
        {list && list.length === 0 && <div className="blank" style={{ gridColumn: '1/-1' }}><div className="e">🛵</div><h3 className="display">Aucun livreur</h3><p>Créez le compte de votre livreur pour qu’il puisse suivre et livrer les commandes.</p></div>}
        {(list || []).map((c) => {
          const s = stat(c.id);
          return (
            <article className="crow" key={c.id}>
              <div className="crow__av">{(c.name || c.username).slice(0, 1).toUpperCase()}</div>
              <div className="crow__info">
                <div className="crow__name">{c.profileDone ? c.name : c.username}</div>
                <div className="crow__meta">
                  <span>@{c.username}</span>
                  {c.profileDone ? <a href={`tel:${telDigits(c.phone)}`}>📞 {c.phone}</a> : <span className="tag">⏳ Profil à compléter</span>}
                </div>
                <div className="crow__meta"><span>✅ {s.done} livrée(s)</span><span>🚚 {s.going} en route</span></div>
                <div className="crow__meta"><small>{c.lastLoginAt ? `Dernière connexion : ${dateTime(c.lastLoginAt)}` : 'Jamais connecté'}</small></div>
                <div className="crow__acts">
                  <button className="mini" onClick={() => { setPw(''); setErrs({}); setResetFor(c); }}>🔑 Nouveau mot de passe</button>
                  <button className="mini mini--danger" onClick={() => del(c)} aria-label={`Supprimer ${c.username}`}>🗑</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau livreur">
        <form onSubmit={create} style={{ display: 'grid', gap: '1rem' }} noValidate>
          <div className={`field${errs.username ? ' is-error' : ''}`}><label htmlFor="cu">Identifiant</label><input className="input" id="cu" autoCapitalize="none" autoCorrect="off" placeholder="Ex : karim" value={u} onChange={(e) => setU(e.target.value)} autoFocus /><span className="err">{errs.username}</span></div>
          <div className={`field${errs.password ? ' is-error' : ''}`}><label htmlFor="cp">Mot de passe</label><input className="input" id="cp" placeholder="6 caractères minimum" value={pw} onChange={(e) => setPw(e.target.value)} /><span className="err">{errs.password}</span></div>
          <div className="row-btns"><button type="button" className="btn btn--ghost" onClick={() => setCreating(false)}>Annuler</button><button className="btn" disabled={busy}>{busy ? 'Création…' : 'Créer le compte'}</button></div>
        </form>
      </Modal>
      <Modal open={!!resetFor} onClose={() => setResetFor(null)} title="Nouveau mot de passe">
        <form onSubmit={reset} style={{ display: 'grid', gap: '1rem' }} noValidate>
          <p className="helper">Pour <b>{resetFor?.name || resetFor?.username}</b>. Il sera déconnecté de ses appareils.</p>
          <div className={`field${errs.password ? ' is-error' : ''}`}><label htmlFor="rp">Mot de passe</label><input className="input" id="rp" placeholder="6 caractères minimum" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /><span className="err">{errs.password}</span></div>
          <div className="row-btns"><button type="button" className="btn btn--ghost" onClick={() => setResetFor(null)}>Annuler</button><button className="btn" disabled={busy}>Enregistrer</button></div>
        </form>
      </Modal>
    </section>
  );
}
