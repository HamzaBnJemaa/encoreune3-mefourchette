'use client';
import { useState } from 'react';
import { useToasts } from '@/hooks/useToasts';
import ProductsTab from './ProductsTab';
import OrdersTab from './OrdersTab';
import CouriersTab from './CouriersTab';

type Tab = 'products' | 'orders' | 'couriers';

export default function AdminApp({ logout }: { logout: () => void }) {
  const { toast, toastView } = useToasts();
  const [tab, setTab] = useState<Tab>('products');
  const [pCount, setPCount] = useState(0);
  const [newOrders, setNewOrders] = useState(0);
  return (
    <div className="app">
      <header className="top">
        <div className="top__brand"><img className="top__logo" src="/3f.png" alt="Encore Une 3ème Fourchette" /><span className="display">Encore une 3ème fourchette <em>admin</em></span></div>
        <div className="top__actions"><a className="btn btn--sm btn--paper" href="/" target="_blank" rel="noopener noreferrer">Voir le site ↗</a><button className="btn btn--sm btn--ghost" onClick={logout}>Déconnexion</button></div>
      </header>
      <nav className="tabs" role="tablist">
        <button className={`tab${tab === 'products' ? ' is-on' : ''}`} role="tab" onClick={() => setTab('products')}>Articles <span className="pill">{pCount}</span></button>
        <button className={`tab${tab === 'orders' ? ' is-on' : ''}`} role="tab" onClick={() => setTab('orders')}>Commandes {newOrders > 0 && <span className="pill pill--hot">{newOrders}</span>}</button>
        <button className={`tab${tab === 'couriers' ? ' is-on' : ''}`} role="tab" onClick={() => setTab('couriers')}>Livreurs</button>
      </nav>
      <main className="main">
        {/* Orders stays mounted so it keeps polling for new orders / livreur updates in the background */}
        <div hidden={tab !== 'orders'}><OrdersTab toast={toast} onNew={setNewOrders} /></div>
        {tab === 'products' && <ProductsTab toast={toast} onCount={setPCount} />}
        {tab === 'couriers' && <CouriersTab toast={toast} />}
      </main>
      {toastView}
    </div>
  );
}
