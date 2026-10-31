import type { Store } from './store';
import { round3, uid } from './server-utils';

export const MAX_IMAGES = 4;
export const MAX_BYTES = 8 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const str = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '');
const num = (v: string) => Number(v.replace(',', '.').replace(/\s/g, ''));

export function parseProduct(fd: FormData) {
  const errors: string[] = [];
  const name = str(fd.get('name')).trim().slice(0, 80);
  const category = str(fd.get('category')).trim().slice(0, 40) || 'Autres';
  const description = str(fd.get('description')).trim().slice(0, 800);
  const unit = str(fd.get('unit')).trim().slice(0, 30);
  const price = num(str(fd.get('price')));
  const saleRaw = str(fd.get('salePrice')).trim();
  const hasSale = saleRaw !== '';
  const salePrice = hasSale ? num(saleRaw) : null;
  const av = str(fd.get('available'));
  const available = !(av === 'false' || av === '0');

  if (!name) errors.push('Le nom est obligatoire.');
  if (!(price >= 0) || !Number.isFinite(price)) errors.push('Prix invalide.');
  if (hasSale && (salePrice === null || !Number.isFinite(salePrice) || salePrice < 0 || salePrice >= price)) errors.push('Le prix promo doit être inférieur au prix normal.');
  return { errors, data: { name, category, description, unit, price: round3(price), salePrice: hasSale && salePrice !== null ? round3(salePrice) : null, available } };
}

/** existing = stored file names; layout = JSON array of existing names and "#<i>" tokens (final photo order). */
export async function resolveImages(store: Store, existing: string[], files: File[], layoutRaw: string) {
  let layout: unknown;
  try { layout = JSON.parse(layoutRaw); } catch { layout = null; }
  if (!Array.isArray(layout)) layout = [...existing, ...files.map((_, i) => '#' + i)];

  const picked: ({ idx: number } | { name: string })[] = [];
  const used = new Set<number>();
  for (const tok of layout as unknown[]) {
    if (typeof tok !== 'string') continue;
    if (tok[0] === '#') {
      const idx = Number(tok.slice(1));
      if (files[idx] && !used.has(idx)) { used.add(idx); picked.push({ idx }); }
    } else if (existing.includes(tok) && !picked.some((x) => 'name' in x && x.name === tok)) picked.push({ name: tok });
  }
  const out: string[] = [];
  for (const item of picked.slice(0, MAX_IMAGES)) {
    if ('idx' in item) {
      const f = files[item.idx];
      const name = `${Date.now()}-${uid()}${EXT[f.type] || '.jpg'}`;
      await store.images.save(name, Buffer.from(await f.arrayBuffer()), f.type);
      out.push(name);
    } else out.push(item.name);
  }
  for (const old of existing) if (!out.includes(old)) await store.images.remove(old);
  return out;
}

export function uploadedFiles(fd: FormData): File[] {
  return fd.getAll('images').filter((f): f is File => typeof f !== 'string' && f.size > 0 && f.size <= MAX_BYTES && !!EXT[f.type]).slice(0, MAX_IMAGES);
}
