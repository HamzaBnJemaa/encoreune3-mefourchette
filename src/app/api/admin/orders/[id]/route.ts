import { adminGuard, isResponse } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { applyStatus, fail, json } from '@/lib/server-utils';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const { id } = await params;
  const store = await getStore();
  const o = await store.orders.get(id);
  if (!o) return fail('Commande introuvable.', 404);
  const b = (await req.json().catch(() => ({}))) as { status?: string; note?: string };
  if (!ORDER_STATUSES.includes(b.status as OrderStatus)) return fail('Statut invalide.');
  if (b.status !== o.status) applyStatus(o, b.status as OrderStatus, { role: 'admin', name: 'Admin', username: g.u }, b.note?.slice(0, 200));
  await store.orders.put(o);
  return json(o);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const { id } = await params;
  const store = await getStore();
  if (!(await store.orders.get(id))) return fail('Commande introuvable.', 404);
  await store.orders.del(id);
  return json({ ok: true });
}
