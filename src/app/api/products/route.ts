import { getStore } from '@/lib/store';
import { json, newestFirst, publicProduct } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await getStore();
  const list = (await store.products.list()).sort(newestFirst);
  return json(list.map((p) => publicProduct(store, p)));
}
