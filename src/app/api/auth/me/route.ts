import { courierGuard, isResponse, publicCourier, sessionFrom, setSession } from '@/lib/auth';
import { fail, json } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

/** Who is logged in? Also renews the one-year cookie on every visit. */
export async function GET(req: Request) {
  const s = sessionFrom(req);
  if (!s) return fail('Non connecté', 401);
  if (s.r === 'admin') return setSession(req, json({ ok: true, role: 'admin', user: s.u }), { r: 'admin', u: s.u });
  const g = await courierGuard(req);
  if (isResponse(g)) return g;
  return setSession(req, json({ ok: true, role: 'courier', user: g.courier.username, courier: publicCourier(g.courier) }), { r: 'courier', u: g.courier.username, i: g.courier.id, v: g.courier.pv });
}
