import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import type { Courier, HistoryEntry, Order, OrderStatus, Product, PublicProduct } from './types';
import type { Store } from './store';

export const uid = () => crypto.randomBytes(6).toString('hex');
export const round3 = (n: number) => Math.round(n * 1000) / 1000;
export const newestFirst = (a: { createdAt?: string }, b: { createdAt?: string }) => (b.createdAt || '').localeCompare(a.createdAt || '');
export const noStore = <T extends NextResponse>(r: T) => { r.headers.set('Cache-Control', 'no-store'); return r; };
export const json = (data: unknown, status = 200) => noStore(NextResponse.json(data, { status }));
export const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) => json({ error, ...extra }, status);

export function publicProduct(store: Store, p: Product): PublicProduct {
  return {
    id: p.id, name: p.name, category: p.category, description: p.description, unit: p.unit || '',
    price: p.price, salePrice: p.salePrice ?? null, available: p.available !== false,
    images: (p.images || []).map((f) => store.images.url(f)), createdAt: p.createdAt,
  };
}

export type Actor = { role: HistoryEntry['by']['role']; name: string; username?: string };

/** Change an order's status and append a history line (who / when / from → to). */
export function applyStatus(order: Order, to: OrderStatus, actor: Actor, note?: string, courier?: Courier) {
  const from = order.status;
  const at = new Date().toISOString();
  order.history = [...(order.history || []), { at, by: actor, from, to, ...(note ? { note } : {}) }];
  order.status = to;
  order.updatedAt = at;
  if (courier) order.courier = { id: courier.id, name: courier.name, phone: courier.phone, username: courier.username };
}
