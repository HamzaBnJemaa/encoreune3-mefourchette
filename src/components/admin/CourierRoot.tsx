'use client';
import AuthGate from './AuthGate';
import CourierApp from './CourierApp';

export default function CourierRoot() {
  return (
    <AuthGate role="courier" title={<>Espace<br />livreur</>} hint="Connectez-vous pour voir et livrer les commandes.">
      {(me, logout, _refresh) => (me.courier ? <CourierApp initial={me.courier} logout={logout} /> : null)}
    </AuthGate>
  );
}
