import { adminGuard, isResponse } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { fail, json, newestFirst, publicProduct, uid } from '@/lib/server-utils';
import { parseProduct, resolveImages, uploadedFiles } from '@/lib/products';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const store = await getStore();
  return json((await store.products.list()).sort(newestFirst).map((p) => publicProduct(store, p)));
}

export async function POST(req: Request) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const fd = await req.formData().catch(() => null);
  if (!fd) return fail('Formulaire invalide.');
  const { errors, data } = parseProduct(fd);
  if (errors.length) return fail(errors.join(' '));
  const store = await getStore();
  const product: Product = {
    id: uid(), ...data,
    images: await resolveImages(store, [], uploadedFiles(fd), String(fd.get('layout') ?? '')),
    createdAt: new Date().toISOString(),
  };
  await store.products.put(product);
  return json(publicProduct(store, product));
}
