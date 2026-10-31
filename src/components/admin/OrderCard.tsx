'use client';
import { useState } from 'react';
import { STATUS_LABEL, type Order, type OrderStatus } from '@/lib/types';
import { dateTime, fmt, mapsLink, money, telDigits, waLink } from '@/lib/client';

export const orderText = (o: Order) => [
  `Commande ${o.id}`, ...o.items.map((i) => `• ${i.qty} × ${i.name}${i.unit ? ' (' + i.unit + ')' : ''} — ${fmt(i.lineTotal)} DT`),
  `Total : ${fmt(o.total)} DT`, '', `Client : ${o.customer.name}`, `Tél : ${o.customer.phone}`, `Adresse : ${o.customer.address}`, o.customer.note ? `Note : ${o.customer.note}` : '',
].filter((x, i, a) => x || a[i - 1]).join('\n');

export function StatusTag({ s }: { s: OrderStatus }) { return <span className={`tag tag--${s}`}>{STATUS_LABEL[s]}</span>; }

function History({ o }: { o: Order }) {
  const h = [...(o.history || [])].reverse();
  if (!h.length) return null;
  return (
    <details className="hist">
      <summary>Historique ({h.length})</summary>
      <ul>
        {h.map((x, i) => (
          <li key={i}>
            <span>{x.by.role === 'courier' ? '🚚' : x.by.role === 'admin' ? '🧑‍🍳' : '⚙️'} <b>{x.by.name || x.by.username || '—'}</b> : {STATUS_LABEL[x.from]} → <b>{STATUS_LABEL[x.to]}</b></span>
            {x.note && <span>« {x.note} »</span>}
            <small>{dateTime(x.at)}</small>
          </li>
        ))}
      </ul>
    </details>
  );
}

type Common = { o: Order; delay?: number };

/* ----------------------------- admin ----------------------------- */
export function AdminOrderCard({ o, delay = 0, onStatus, onDelete, onCopy }: Common & { onStatus: (id: string, s: OrderStatus) => void; onDelete: (id: string) => void; onCopy: (o: Order) => void }) {
  const wa = waLink(o.customer.phone, `Bonjour ${o.customer.name.split(' ')[0]}, c’est Encore Une 3ème Fourchette 🍴 Nous avons bien reçu votre commande ${o.id} (${fmt(o.total)} DT).`);
  return (
    <article className="order" data-status={o.status} style={{ animationDelay: `${delay}ms` }}>
      <header className="order__head"><span className="order__id">{o.id}</span><span className="order__time">{dateTime(o.createdAt)}</span></header>
      <div className="order__body">
        <ul className="order__items">{o.items.map((it, i) => <li key={i}><span>{it.qty} × {it.name}{it.unit && <small style={{ opacity: 0.6 }}> ({it.unit})</small>}</span><b>{money(it.lineTotal)}</b></li>)}</ul>
        <div className="order__total"><span>Total</span><span>{money(o.total)}</span></div>
        <div className="order__cust"><strong>{o.customer.name}</strong><span>📞 {o.customer.phone}</span><span>📍 {o.customer.address}</span>{o.customer.note && <span className="note">« {o.customer.note} »</span>}</div>
        {o.courier && <div className="courier-line">🚚 <b>{o.courier.name || o.courier.username}</b>{o.courier.phone && <a href={`tel:${telDigits(o.courier.phone)}`}>{o.courier.phone}</a>}<StatusTag s={o.status} /></div>}
        <div className="order__acts">
          <a className="mini" href={`tel:${telDigits(o.customer.phone)}`}>📞 Appeler</a>
          <a className="mini" href={wa} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
          <button className="mini" onClick={() => onCopy(o)}>📋 Copier</button>
          <select className="select" aria-label="Statut" value={o.status} onChange={(e) => onStatus(o.id, e.target.value as OrderStatus)}>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
          </select>
          <button className="mini mini--danger" aria-label="Supprimer la commande" onClick={() => onDelete(o.id)}>🗑</button>
        </div>
        <History o={o} />
      </div>
    </article>
  );
}

/* ----------------------------- livreur ----------------------------- */
export function CourierOrderCard({ o, delay = 0, busy, onStatus, onCancel }: Common & { busy: boolean; onStatus: (id: string, s: OrderStatus) => void; onCancel: (o: Order) => void }) {
  const [open, setOpen] = useState(false);
  const wa = waLink(o.customer.phone, `Bonjour ${o.customer.name.split(' ')[0]}, je suis votre livreur Encore Une 3ème Fourchette 🍴 pour la commande ${o.id}.`);
  return (
    <article className="order" data-status={o.status} style={{ animationDelay: `${delay}ms` }}>
      <header className="order__head"><span className="order__id">{o.id}</span><StatusTag s={o.status} /><span className="order__time">{dateTime(o.createdAt)}</span></header>
      <div className="order__body">
        <div className="order__cust">
          <strong>{o.customer.name}</strong>
          <a href={`tel:${telDigits(o.customer.phone)}`}>📞 {o.customer.phone}</a>
          <a href={mapsLink(o.customer.address)} target="_blank" rel="noopener noreferrer">📍 {o.customer.address}</a>
          {o.customer.note && <span className="note">« {o.customer.note} »</span>}
        </div>
        <button className="mini" style={{ justifySelf: 'start' }} onClick={() => setOpen((x) => !x)}>{open ? 'Masquer' : `Voir les articles (${o.items.reduce((s, i) => s + i.qty, 0)})`}</button>
        {open && <ul className="order__items">{o.items.map((it, i) => <li key={i}><span>{it.qty} × {it.name}{it.unit && <small style={{ opacity: 0.6 }}> ({it.unit})</small>}</span><b>{money(it.lineTotal)}</b></li>)}</ul>}
        <div className="order__total"><span>À encaisser</span><span>{money(o.total)}</span></div>
        <div className="order__acts" style={{ gap: '0.4rem' }}>
          <a className="mini" href={`tel:${telDigits(o.customer.phone)}`}>📞 Appeler</a>
          <a className="mini" href={wa} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
          <a className="mini" href={mapsLink(o.customer.address)} target="_blank" rel="noopener noreferrer">🧭 Itinéraire</a>
        </div>
        <div className="order__acts--big">
          {(o.status === 'new' || o.status === 'confirmed') && <button className="bigbtn bigbtn--go bigbtn--wide" disabled={busy} onClick={() => onStatus(o.id, 'on_the_way')}>🚚 Je pars livrer</button>}
          {o.status === 'on_the_way' && <button className="bigbtn bigbtn--ok" disabled={busy} onClick={() => onStatus(o.id, 'delivered')}>✅ Livrée</button>}
          {(o.status === 'new' || o.status === 'confirmed' || o.status === 'on_the_way') && <button className="bigbtn bigbtn--no" disabled={busy} onClick={() => onCancel(o)}>❌ Annuler</button>}
          {o.status === 'on_the_way' && <button className="bigbtn bigbtn--wide" disabled={busy} onClick={() => onStatus(o.id, 'confirmed')}>↩︎ Remettre à livrer</button>}
          {(o.status === 'delivered' || o.status === 'cancelled') && <button className="bigbtn bigbtn--wide" disabled={busy} onClick={() => onStatus(o.id, 'confirmed')}>↩︎ Corriger : remettre à livrer</button>}
        </div>
        <History o={o} />
      </div>
    </article>
  );
}
