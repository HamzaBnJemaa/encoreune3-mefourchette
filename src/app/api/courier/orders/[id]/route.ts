import { courierGuard, isResponse } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { applyStatus, fail, json } from '@/lib/server-utils';
import { COURIER_STATUSES, type OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

/** The livreur can only change the status: à livrer / en route / livrée / annulée (+ optional note). */
export async function PATCH(req: Request, { params }: Ctx) {
  const g = await courierGuard(req); if (isResponse(g)) return g;
  const c = g.courier;
  if (!c.profileDone) return fail('Complétez votre profil d’abord.', 403, { needsProfile: true });
  const { id } = await params;
  const store = await getStore();
  const o = await store.orders.get(id);
  if (!o) return fail('Commande introuvable.', 404);
  const b = (await req.json().catch(() => ({}))) as { status?: string; note?: string };
  if (!COURIER_STATUSES.includes(b.status as OrderStatus)) return fail('Statut invalide.');
  if (o.courier && o.courier.id !== c.id) return fail(`Commande prise en charge par ${o.courier.name || 'un autre livreur'}.`, 403);
  if (b.status !== o.status) applyStatus(o, b.status as OrderStatus, { role: 'courier', name: c.name, username: c.username }, b.note?.trim().slice(0, 200), c);
  await store.orders.put(o);
  return json(o);
}
