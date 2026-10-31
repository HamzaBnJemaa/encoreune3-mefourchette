'use client';
import { useEffect, useMemo, useState } from 'react';
import { STATUS_LABEL, type Order, type OrderStatus, type PublicCourier } from '@/lib/types';
import { ApiError, api, jsonBody } from '@/lib/client';
import { useToasts } from '@/hooks/useToasts';
import { usePolling } from '@/hooks/usePolling';
import { CourierOrderCard } from './OrderCard';
import { Modal } from './ui';

type Filter = 'todo' | 'going' | 'done' | 'all';

export default function CourierApp({ initial, logout }: { initial: PublicCourier; logout: () => void }) {
  const { toast, toastView } = useToasts();
  const [me, setMe] = useState(initial);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<Filter>('todo');
  const [busy, setBusy] = useState(false);
  const [cancelFor, setCancelFor] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  // first-login form
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [errs, setErrs] = useState<{ name?: string; phone?: string }>({}); const [saving, setSaving] = useState(false);

  async function load() {
    if (!me.profileDone) return;
    try { setOrders(await api<Order[]>('/api/courier/orders')); }
    catch (e) { if (e instanceof ApiError && e.status === 401) window.location.reload(); else if (!orders) toast((e as Error).message, 'error'); }
  }
  usePolling(load, 15000);
  useEffect(() => { if (me.profileDone) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [me.profileDone]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErrs({});
    try { setMe(await api<PublicCourier>('/api/courier/me', jsonBody('PUT', { name, phone }))); toast('Bienvenue ! 🛵'); }
    catch (ex) { if (ex instanceof ApiError && typeof ex.data.field === 'string') setErrs({ [ex.data.field]: ex.message }); else toast((ex as Error).message, 'error'); }
    setSaving(false);
  }
  async function setStatus(id: string, status: OrderStatus, note?: string) {
    setBusy(true);
    try { await api(`/api/courier/orders/${id}`, jsonBody('PATCH', { status, note })); await load(); toast(`${id} : ${STATUS_LABEL[status]}`); }
    catch (e) { toast((e as Error).message, 'error'); await load(); }
    setBusy(false);
  }

  const buckets = useMemo(() => {
    const l = orders || [];
    return {
      todo: l.filter((o) => o.status === 'new' || o.status === 'confirmed'),
      going: l.filter((o) => o.status === 'on_the_way'),
      done: l.filter((o) => o.status === 'delivered' || o.status === 'cancelled'),
      all: l,
    };
  }, [orders]);
  const shown = buckets[filter];
  const cashToCollect = buckets.going.reduce((s, o) => s + o.total, 0);

  return (
    <div className="app">
      <header className="top">
        <div className="top__brand"><span className="top__logo">🛵</span><span className="display">Livraisons <em>livreur</em></span></div>
        <div className="top__actions"><button className="btn btn--sm btn--ghost" onClick={logout}>Déconnexion</button></div>
      </header>

      <main className="cour-main">
        <div className="cour-hello"><h1 className="display">Salut {me.profileDone ? me.name.split(' ')[0] : ''} 👋</h1></div>
        <div className="cour-stats">
          <div className="stat"><b>{buckets.todo.length}</b><span>À livrer</span></div>
          <div className="stat"><b>{buckets.going.length}</b><span>En route</span></div>
          <div className="stat"><b>{cashToCollect.toLocaleString('fr-FR', { maximumFractionDigits: 3 })}</b><span>DT en route</span></div>
        </div>
        <div className="chips">
          {([['todo', `À livrer (${buckets.todo.length})`], ['going', `En route (${buckets.going.length})`], ['done', `Terminées (${buckets.done.length})`], ['all', 'Toutes']] as [Filter, string][]).map(([k, l]) => (
            <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="cour-list">
          {orders && shown.length === 0 && <div className="blank"><div className="e">🎉</div><h3 className="display">Rien ici</h3><p>Aucune commande dans cette liste pour le moment.</p></div>}
          {shown.map((o, i) => <CourierOrderCard key={o.id} o={o} delay={Math.min(i, 6) * 40} busy={busy} onStatus={(id, s) => setStatus(id, s)} onCancel={(x) => { setReason(''); setCancelFor(x); }} />)}
        </div>
      </main>

      {/* first login: name + phone (visible to the admin) */}
      <Modal open={!me.profileDone} onClose={() => {}} dismissible={false} title="Bienvenue !">
        <form onSubmit={saveProfile} style={{ display: 'grid', gap: '1rem' }} noValidate>
          <p className="helper">Avant de commencer, dites-nous qui vous êtes. Ces informations sont visibles par l’admin.</p>
          <div className={`field${errs.name ? ' is-error' : ''}`}><label htmlFor="pn">Votre nom</label><input className="input" id="pn" autoComplete="name" placeholder="Ex : Karim Trabelsi" value={name} onChange={(e) => setName(e.target.value)} autoFocus /><span className="err">{errs.name}</span></div>
          <div className={`field${errs.phone ? ' is-error' : ''}`}><label htmlFor="pp">Votre téléphone</label><input className="input" id="pp" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ex : 22 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} /><span className="err">{errs.phone}</span></div>
          <div className="row-btns"><button className="btn btn--lg btn--block" disabled={saving}>{saving ? 'Enregistrement…' : 'Commencer'}</button></div>
        </form>
      </Modal>

      <Modal open={!!cancelFor} onClose={() => setCancelFor(null)} title="Annuler la commande ?">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <p className="helper">Commande <b>{cancelFor?.id}</b> — {cancelFor?.customer.name}. Indiquez la raison (le client n’a pas répondu, adresse introuvable…).</p>
          <div className="field"><label htmlFor="rs">Raison (facultatif)</label><textarea className="textarea" id="rs" rows={3} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <div className="row-btns"><button className="btn btn--ghost" onClick={() => setCancelFor(null)}>Retour</button><button className="btn btn--coral" disabled={busy} onClick={async () => { if (cancelFor) { await setStatus(cancelFor.id, 'cancelled', reason); setCancelFor(null); } }}>Confirmer l’annulation</button></div>
        </div>
      </Modal>
      {toastView}
    </div>
  );
}
