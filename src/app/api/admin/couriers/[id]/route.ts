import { adminGuard, hashPassword, isResponse, publicCourier } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { fail, json } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

/** Reset a livreur's password (logs him out everywhere). */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const { id } = await params;
  const store = await getStore();
  const c = await store.couriers.get(id);
  if (!c) return fail('Livreur introuvable.', 404);
  const b = (await req.json().catch(() => ({}))) as { password?: string };
  const password = String(b.password ?? '');
  if (password.length < 6) return fail('Mot de passe : 6 caractères minimum.');
  c.passHash = hashPassword(password);
  c.pv = (c.pv || 1) + 1;
  await store.couriers.put(c);
  return json(publicCourier(c));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const { id } = await params;
  const store = await getStore();
  if (!(await store.couriers.get(id))) return fail('Livreur introuvable.', 404);
  await store.couriers.del(id); // his past orders keep the courier name in their history
  return json({ ok: true });
}
