import { courierGuard, isResponse, publicCourier } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { fail, json } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const g = await courierGuard(req); if (isResponse(g)) return g;
  return json(publicCourier(g.courier));
}

/** First-login form: name + phone. Shown to the admin in the "Livreurs" tab. */
export async function PUT(req: Request) {
  const g = await courierGuard(req); if (isResponse(g)) return g;
  const b = (await req.json().catch(() => ({}))) as { name?: string; phone?: string };
  const name = String(b.name ?? '').trim().replace(/\s+/g, ' ');
  const phone = String(b.phone ?? '').trim();
  if (name.length < 2 || name.length > 60) return fail('Indiquez votre nom.', 400, { field: 'name' });
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return fail('Numéro de téléphone invalide.', 400, { field: 'phone' });
  const store = await getStore();
  const c = g.courier;
  c.name = name; c.phone = phone.slice(0, 30); c.profileDone = true;
  await store.couriers.put(c);
  return json(publicCourier(c));
}
