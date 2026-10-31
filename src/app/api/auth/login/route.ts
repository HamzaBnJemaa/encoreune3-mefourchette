import { ADMIN_PASSWORD, ADMIN_USER, checkPassword, rateLimited, safeEqual, setSession, tooMany } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { fail, json } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

/** One login for both profiles: the admin (env credentials) or a livreur (account created by the admin). */
export async function POST(req: Request) {
  if (rateLimited(req, 'login', 12, 15 * 60 * 1000)) return tooMany();
  const b = (await req.json().catch(() => ({}))) as { username?: string; password?: string };
  const username = String(b.username ?? '').trim().toLowerCase();
  const password = String(b.password ?? '');

  const isAdmin = safeEqual(username, ADMIN_USER.toLowerCase()) && safeEqual(password, ADMIN_PASSWORD);
  if (isAdmin) return setSession(req, json({ ok: true, role: 'admin' }), { r: 'admin', u: ADMIN_USER });

  const store = await getStore();
  const courier = (await store.couriers.list()).find((c) => c.username === username);
  if (courier && checkPassword(password, courier.passHash)) {
    courier.lastLoginAt = new Date().toISOString();
    await store.couriers.put(courier);
    return setSession(req, json({ ok: true, role: 'courier', needsProfile: !courier.profileDone }), { r: 'courier', u: courier.username, i: courier.id, v: courier.pv });
  }
  return fail('Identifiants incorrects.', 401);
}
