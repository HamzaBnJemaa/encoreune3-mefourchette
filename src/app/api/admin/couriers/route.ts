import { ADMIN_USER, adminGuard, hashPassword, isResponse, publicCourier } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { fail, json, newestFirst, uid } from '@/lib/server-utils';
import type { Courier } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const store = await getStore();
  return json((await store.couriers.list()).sort(newestFirst).map(publicCourier));
}

/** Admin creates a livreur account (username + password). The livreur fills name/phone at first login. */
export async function POST(req: Request) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const b = (await req.json().catch(() => ({}))) as { username?: string; password?: string };
  const username = String(b.username ?? '').trim().toLowerCase();
  const password = String(b.password ?? '');
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return fail('Identifiant : 3 à 30 caractères (lettres, chiffres, . _ -).', 400, { field: 'username' });
  if (username === ADMIN_USER.toLowerCase()) return fail('Cet identifiant est déjà utilisé.', 400, { field: 'username' });
  if (password.length < 6) return fail('Mot de passe : 6 caractères minimum.', 400, { field: 'password' });
  const store = await getStore();
  if ((await store.couriers.list()).some((c) => c.username === username)) return fail('Cet identifiant est déjà utilisé.', 400, { field: 'username' });
  const courier: Courier = { id: uid(), username, passHash: hashPassword(password), pv: 1, name: '', phone: '', profileDone: false, createdAt: new Date().toISOString() };
  await store.couriers.put(courier);
  return json(publicCourier(courier));
}
