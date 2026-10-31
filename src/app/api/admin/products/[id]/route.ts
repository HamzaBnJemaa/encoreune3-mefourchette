import { adminGuard, isResponse } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { fail, json, publicProduct } from '@/lib/server-utils';
import { parseProduct, resolveImages, uploadedFiles } from '@/lib/products';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const { id } = await params;
  const store = await getStore();
  const p = await store.products.get(id);
  if (!p) return fail('Produit introuvable.', 404);
  const fd = await req.formData().catch(() => null);
  if (!fd) return fail('Formulaire invalide.');
  const { errors, data } = parseProduct(fd);
  if (errors.length) return fail(errors.join(' '));
  Object.assign(p, data);
  p.images = await resolveImages(store, p.images || [], uploadedFiles(fd), String(fd.get('layout') ?? ''));
  p.updatedAt = new Date().toISOString();
  await store.products.put(p);
  return json(publicProduct(store, p));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const { id } = await params;
  const store = await getStore();
  const p = await store.products.get(id);
  if (!p) return fail('Produit introuvable.', 404);
  const b = (await req.json().catch(() => ({}))) as { available?: unknown };
  if (typeof b.available === 'boolean') p.available = b.available;
  await store.products.put(p);
  return json(publicProduct(store, p));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = adminGuard(req); if (isResponse(g)) return g;
  const { id } = await params;
  const store = await getStore();
  const p = await store.products.get(id);
  if (!p) return fail('Produit introuvable.', 404);
  for (const f of p.images || []) await store.images.remove(f);
  await store.products.del(id);
  return json({ ok: true });
}
