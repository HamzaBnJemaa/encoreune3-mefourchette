import { getStore, typeOf } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const store = await getStore();
  if (!/^[\w.-]+$/.test(name) || !store.images.read) return new Response(null, { status: 404 });
  const img = await store.images.read(name).catch(() => null);
  if (!img) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(img.body), {
    headers: { 'Content-Type': img.type || typeOf(name), 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
  });
}
