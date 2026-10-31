import { courierGuard, isResponse } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { fail, json, newestFirst } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

/** The livreur sees the orders (customer info, items, total) — never the products. */
export async function GET(req: Request) {
  const g = await courierGuard(req); if (isResponse(g)) return g;
  if (!g.courier.profileDone) return fail('Complétez votre profil d’abord.', 403, { needsProfile: true });
  const store = await getStore();
  return json((await store.orders.list()).sort(newestFirst));
}
