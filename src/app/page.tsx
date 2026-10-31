import './shop.css';
import Shop from '@/components/shop/Shop';
import Splash from '@/components/shop/Splash';
import { getStore } from '@/lib/store';
import { newestFirst, publicProduct } from '@/lib/server-utils';
import type { PublicProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let products: PublicProduct[] = [];
  try {
    const store = await getStore();
    products = (await store.products.list()).sort(newestFirst).map((p) => publicProduct(store, p));
  } catch (e) {
    console.error('Could not load products:', e);
  }
  return (<><Splash /><Shop products={products} /></>);
}
