'use client';
import AuthGate from './AuthGate';
import AdminApp from './AdminApp';

export default function AdminRoot() {
  return (
    <AuthGate role="admin" title={<>Espace<br />admin</>} hint="Connectez-vous pour gérer vos articles, vos commandes et vos livreurs.">
      {(_me, logout) => <AdminApp logout={logout} />}
    </AuthGate>
  );
}
