import { adminGuard, isResponse } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { json, newestFirst } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const store = await getStore();
  return json((await store.orders.list()).sort(newestFirst));
}
