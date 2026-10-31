'use client';
import { useState } from 'react';
import { api, jsonBody } from '@/lib/client';

export default function LoginCard({ title, hint, onDone }: { title: React.ReactNode; hint: string; onDone: (role: 'admin' | 'courier') => void }) {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await api<{ role: 'admin' | 'courier' }>('/api/auth/login', jsonBody('POST', { username, password })); onDone(r.role); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : 'Erreur'); }
    setBusy(false);
  }
  return (
    <section className="login">
      <span className="login__blob login__blob--1" /><span className="login__blob login__blob--2" />
      <form className="login__card" onSubmit={submit}>
        <img className="login__logo" src="/grandmother5.png" alt="Encore une 3ème fourchette" />
        <h1 className="display">{title}</h1>
        <p>{hint}</p>
        <div className="field"><label htmlFor="lu">Identifiant</label><input className="input" id="lu" autoComplete="username" autoCapitalize="none" autoCorrect="off" required value={username} onChange={(e) => setU(e.target.value)} /></div>
        <div className="field"><label htmlFor="lp">Mot de passe</label><input className="input" id="lp" type="password" autoComplete="current-password" required value={password} onChange={(e) => setP(e.target.value)} /></div>
        {err && <div className="form__err">{err}</div>}
        <button className="btn btn--lg btn--block" type="submit" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        <a className="login__back" href="/">← Retour au site</a>
      </form>
    </section>
  );
}
