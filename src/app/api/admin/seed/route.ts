import { adminGuard, isResponse } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { DEMO_PRODUCTS } from '@/lib/demo';
import { fail, json, uid } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

/** Adds 12 demo articles (no photos) when the shop is empty. */
export async function POST(req: Request) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const store = await getStore();
  if ((await store.products.list()).length) return fail('La boutique contient déjà des articles.');
  let i = 0;
  for (const [name, category, description, unit, price, salePrice] of DEMO_PRODUCTS) {
    await store.products.put({ id: uid(), name, category, description, unit, price, salePrice, available: true, images: [], createdAt: new Date(Date.now() - i++ * 1000).toISOString() });
  }
  return json({ ok: true, count: DEMO_PRODUCTS.length });
}
