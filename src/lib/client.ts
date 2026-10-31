import type { PublicProduct } from './types';

export const fmt = (n: number) => (Math.round(n * 1000) / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
export const money = (n: number) => `${fmt(n)} DT`;
export const priceOf = (p: Pick<PublicProduct, 'price' | 'salePrice'>) => (p.salePrice != null ? p.salePrice : p.price);
export const pct = (p: Pick<PublicProduct, 'price' | 'salePrice'>) => (p.salePrice != null ? Math.round((1 - p.salePrice / p.price) * 100) : 0);

const EMOJI: [RegExp, string][] = [
  [/croissant|pain au|viennois/i, '🥐'], [/shneck|snek|schneck|escargot|cannelle/i, '🥐'], [/brownie|chocolat/i, '🍫'],
  [/sabl|biscuit|cookie/i, '🍪'], [/dro3|dro|gâteau|gateau|cake|tarte|patisserie|pâtisserie/i, '🍰'],
  [/confiture|jam/i, '🍓'], [/harissa/i, '🌶️'], [/bssissa|bsissa|bocal/i, '🫙'], [/merguez/i, '🌭'],
  [/boulette|viande|kefta/i, '🍖'], [/pizza/i, '🍕'], [/brik|tunisien|traditionnel|couscous/i, '🥘'],
];
export const emojiFor = (p: { name: string; category: string }) => {
  const s = `${p.name} ${p.category}`;
  for (const [re, e] of EMOJI) if (re.test(s)) return e;
  return '🍴';
};

export const storage = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

export class ApiError extends Error {
  status: number; data: Record<string, unknown>;
  constructor(message: string, status: number, data: Record<string, unknown>) { super(message); this.status = status; this.data = data; }
}
/** fetch JSON helper: throws ApiError with the server's message. */
export async function api<T = unknown>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', ...opts });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(String(data.error || 'Erreur'), res.status, data);
  return data as T;
}
export const jsonBody = (method: string, body: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const dateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
};
export const telDigits = (p: string) => p.replace(/[^\d+]/g, '');
export const waLink = (phone: string, text: string) => {
  let d = phone.replace(/\D/g, '');
  if (d.length === 8) d = '216' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
};
export const mapsLink = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
