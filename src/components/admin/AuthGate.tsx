'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import type { PublicCourier } from '@/lib/types';
import LoginCard from './LoginCard';

type Me = { role: 'admin' | 'courier'; user: string; courier?: PublicCourier };

/**
 * Checks the session (cookie lasts a year, renewed on every visit) and shows the login if needed.
 * A livreur opening /admin (or the admin opening /livreur) is sent to the right space.
 */
export default function AuthGate({ role, title, hint, children }: { role: 'admin' | 'courier'; title: React.ReactNode; hint: string; children: (me: Me, logout: () => void, refresh: () => void) => React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'out' | { me: Me }>('loading');
  const home = (r: 'admin' | 'courier') => (r === 'admin' ? '/admin' : '/livreur');

  const load = useCallback(async () => {
    try {
      const me = await api<Me>('/api/auth/me');
      if (me.role !== role) { window.location.replace(home(me.role)); return; }
      setState({ me });
    } catch { setState('out'); }
  }, [role]);
  useEffect(() => { load(); }, [load]);

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setState('out'); };

  return (
    <div className="adm">
      {state === 'loading' ? <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', fontSize: '3rem' }}>🍴</div>
        : state === 'out' ? <LoginCard title={title} hint={hint} onDone={(r) => { if (r !== role) window.location.replace(home(r)); else load(); }} />
          : children(state.me, logout, load)}
    </div>
  );
}
