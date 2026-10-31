'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { priceOf, storage } from '@/lib/client';
import { SHIPPING_FEE, subtotalWithShipping } from '@/lib/pricing';

export function useCart(products: PublicProduct[]) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  // load from localStorage after hydration; drop products that vanished / sold out
  useEffect(() => {
    const saved = storage.get<Record<string, number>>('efs_cart', {});
    const clean: Record<string, number> = {};
    for (const [id, q] of Object.entries(saved)) { const p = products.find((x) => x.id === id); if (p && p.available && q > 0) clean[id] = Math.min(50, q); }
    setCart(clean); setReady(true);
  }, [products]);
  useEffect(() => { if (ready) storage.set('efs_cart', cart); }, [cart, ready]);

  const setQty = useCallback((id: string, q: number) => {
    setCart((c) => { const n = { ...c }; const v = Math.max(0, Math.min(50, q)); if (v) n[id] = v; else delete n[id]; return n; });
  }, []);
  const clear = useCallback(() => setCart({}), []);

  const { count, subtotal, shipping, total, saving } = useMemo(() => {
    let count = 0, subtotal = 0, saving = 0;
    for (const [id, q] of Object.entries(cart)) {
      const p = products.find((x) => x.id === id); if (!p) continue;
      count += q; subtotal += priceOf(p) * q; if (p.salePrice != null) saving += (p.price - p.salePrice) * q;
    }
    const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
    return { count, subtotal, shipping, total: subtotalWithShipping(subtotal), saving };
  }, [cart, products]);
  return { cart, setQty, clear, count, subtotal, shipping, total, saving };
}
