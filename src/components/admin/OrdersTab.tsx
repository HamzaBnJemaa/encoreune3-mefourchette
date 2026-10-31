'use client';
import { useRef, useState } from 'react';
import { STATUS_LABEL, type Order, type OrderStatus } from '@/lib/types';
import { api, jsonBody } from '@/lib/client';
import { usePolling } from '@/hooks/usePolling';
import { AdminOrderCard, orderText } from './OrderCard';

type Props = { toast: (m: string, t?: 'error') => void; onNew: (n: number) => void };

export default function OrdersTab({ toast, onNew }: Props) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const seenNew = useRef<number | null>(null);
  const seenChange = useRef<string>('');

  async function load(quiet = true) {
    try {
      const list = await api<Order[]>('/api/admin/orders');
      setOrders(list);
      const fresh = list.filter((o) => o.status === 'new').length;
      if (quiet && seenNew.current !== null && fresh > seenNew.current) toast(`🔔 ${fresh - seenNew.current} nouvelle(s) commande(s) !`);
      seenNew.current = fresh; onNew(fresh);
      document.title = (fresh ? `(${fresh}) ` : '') + 'Admin — Encore Une 3ème Fourchette';

      // what did the livreur change since the last check?
      const changes = list.flatMap((o) => (o.history || []).filter((h) => h.by.role === 'courier').map((h) => ({ o, h }))).sort((a, b) => a.h.at.localeCompare(b.h.at));
      const newest = changes.length ? changes[changes.length - 1].h.at : '';
      if (quiet && seenChange.current) for (const { o, h } of changes.filter((c) => c.h.at > seenChange.current)) toast(`🚚 ${h.by.name || 'Livreur'} : ${o.id} → ${STATUS_LABEL[h.to]}`);
      seenChange.current = newest || seenChange.current || '0';
    } catch (e) { if (!orders) toast((e as Error).message, 'error'); }
  }
  usePolling(() => load(true), 20000);

  async function setStatus(id: string, status: OrderStatus) {
    try { await api(`/api/admin/orders/${id}`, jsonBody('PATCH', { status })); await load(false); toast(`Statut : ${STATUS_LABEL[status]}`); } catch (e) { toast((e as Error).message, 'error'); }
  }
  async function del(id: string) {
    if (!confirm(`Supprimer la commande ${id} ?`)) return;
    try { await api(`/api/admin/orders/${id}`, { method: 'DELETE' }); await load(false); toast('Commande supprimée'); } catch (e) { toast((e as Error).message, 'error'); }
  }
  async function copy(o: Order) { try { await navigator.clipboard.writeText(orderText(o)); toast('Commande copiée ✓'); } catch { toast('Copie impossible', 'error'); } }

  const list = (orders || []).filter((o) => filter === 'all' || o.status === filter);
  const count = (s: OrderStatus) => (orders || []).filter((o) => o.status === s).length;
  return (
    <section>
      <div className="bar">
        <h2 className="display">Commandes</h2>
        <div className="chips">
          <button className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Toutes</button>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <button key={s} className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>{STATUS_LABEL[s]} ({count(s)})</button>)}
        </div>
      </div>
      <div className="olist">
        {orders && list.length === 0 && <div className="blank" style={{ gridColumn: '1/-1' }}><div className="e">📭</div><h3 className="display">Aucune commande</h3><p>Les commandes de vos clients apparaîtront ici.</p></div>}
        {list.map((o, i) => <AdminOrderCard key={o.id} o={o} delay={Math.min(i, 8) * 40} onStatus={setStatus} onDelete={del} onCopy={copy} />)}
      </div>
    </section>
  );
}
