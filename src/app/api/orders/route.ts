import crypto from 'node:crypto';
import { getStore } from '@/lib/store';
import { rateLimited, tooMany } from '@/lib/auth';
import { fail, json, round3 } from '@/lib/server-utils';
import { notifyByEmail } from '@/lib/notify';
import { SHIPPING_FEE } from '@/lib/pricing';
import type { Order, OrderItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (rateLimited(req, 'order', 10, 10 * 60 * 1000)) return tooMany();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (b.website) return json({ ok: true, id: 'EF-00000' }); // honeypot: pretend success

  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  const phoneRaw = String(b.phone || '').trim();
  const digits = phoneRaw.replace(/\D/g, '');
  const address = String(b.address || '').trim();
  const note = String(b.note || '').trim().slice(0, 300);
  if (name.length < 2 || name.length > 80) return fail('Veuillez saisir votre nom.', 400, { field: 'name' });
  if (digits.length < 8 || digits.length > 15) return fail('Numéro de téléphone invalide.', 400, { field: 'phone' });
  if (address.length < 5 || address.length > 300) return fail('Veuillez saisir votre adresse.', 400, { field: 'address' });
  const raw = b.items;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 60) return fail('Votre panier est vide.');

  const store = await getStore();
  const all = await store.products.list();
  const items: OrderItem[] = [];
  for (const it of raw as { id?: unknown; qty?: unknown }[]) {
    const p = all.find((x) => x.id === String(it?.id));
    const qty = Math.floor(Number(it?.qty));
    if (!p || p.available === false) return fail('Un article du panier n’est plus disponible.');
    if (!(qty >= 1 && qty <= 50)) return fail('Quantité invalide.');
    const unitPrice = p.salePrice != null ? p.salePrice : p.price;
    items.push({ id: p.id, name: p.name, unit: p.unit || '', qty, price: unitPrice, regularPrice: p.price, lineTotal: round3(unitPrice * qty) });
  }
  const subtotal = round3(items.reduce((s, i) => s + i.lineTotal, 0));
  const orderTotal = round3(subtotal + (subtotal > 0 ? SHIPPING_FEE : 0));
  const createdAt = new Date().toISOString();
  const order: Order = {
    id: 'EF-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    createdAt, updatedAt: createdAt, status: 'new',
    customer: { name, phone: phoneRaw.slice(0, 30), address, note },
    items, total: orderTotal, courier: null, history: [],
  };
  await store.orders.put(order);
  await notifyByEmail(order).catch((e) => console.error('Email error:', e instanceof Error ? e.message : e)); // awaited: serverless may freeze after the response
  return json({ ok: true, id: order.id, total: order.total });
}
