/**
 * Storage layer — same interface, three backends:
 *   local     JSON file + ./data/uploads            (dev, or a server with a persistent disk)
 *   supabase  Postgres tables + Storage bucket      (SUPABASE_URL + SUPABASE_SERVICE_KEY)
 *   firebase  Firestore + Cloud Storage             (STORAGE_BACKEND=firebase + FIREBASE_STORAGE_BUCKET)
 * Auto-detected unless STORAGE_BACKEND is set.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Courier, Order, Product } from './types';

export interface Collection<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  put(obj: T): Promise<void>;
  del(id: string): Promise<void>;
}
export interface Images {
  save(name: string, buf: Buffer, mime: string): Promise<void>;
  remove(name: string): Promise<void>;
  url(name: string): string;
  read?(name: string): Promise<{ body: Buffer; type: string }>;
}
export interface Store {
  name: string;
  products: Collection<Product>;
  orders: Collection<Order>;
  couriers: Collection<Courier>;
  images: Images;
}

const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
export const typeOf = (name: string) => MIME[path.extname(name).toLowerCase()] || 'application/octet-stream';

/* ---------------------------- LOCAL ---------------------------- */
function localStore(): Store {
  const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
  const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
  const DB_FILE = path.join(DATA_DIR, 'db.json');
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  type DB = { products: Product[]; orders: Order[]; couriers: Courier[] };
  let db: DB = { products: [], orders: [], couriers: [] };
  try { db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) }; } catch { /* first run */ }
  const save = () => {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DB_FILE);
  };
  const coll = <K extends keyof DB>(key: K): Collection<DB[K][number]> => ({
    async list() { return (db[key] as DB[K][number][]).map((x) => ({ ...x })); },
    async get(id) { const x = (db[key] as DB[K][number][]).find((o) => o.id === id); return x ? { ...x } : null; },
    async put(obj) {
      const arr = db[key] as DB[K][number][];
      const i = arr.findIndex((o) => o.id === obj.id);
      if (i < 0) arr.push(obj); else arr[i] = obj;
      save();
    },
    async del(id) {
      const arr = db[key] as DB[K][number][];
      const i = arr.findIndex((o) => o.id === id);
      if (i >= 0) { arr.splice(i, 1); save(); }
    },
  });
  return {
    name: `local (${DATA_DIR})`,
    products: coll('products'),
    orders: coll('orders'),
    couriers: coll('couriers'),
    images: {
      async save(name, buf) { await fs.promises.writeFile(path.join(UPLOAD_DIR, name), buf); },
      async remove(name) { await fs.promises.unlink(path.join(UPLOAD_DIR, name)).catch(() => {}); },
      url: (name) => `/uploads/${name}`,
      async read(name) { return { body: await fs.promises.readFile(path.join(UPLOAD_DIR, name)), type: typeOf(name) }; },
    },
  };
}

/* --------------------------- SUPABASE -------------------------- */
function supabaseStore(): Store {
  const URL_ = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || '';
  const BUCKET = process.env.SUPABASE_BUCKET || 'products';
  if (!URL_ || !KEY) throw new Error('Supabase backend needs SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  const hdr = (extra: Record<string, string> = {}) => ({ apikey: KEY, ...(KEY.startsWith('eyJ') ? { Authorization: `Bearer ${KEY}` } : {}), ...extra });

  async function call(method: string, url: string, opts: { body?: BodyInit; headers?: Record<string, string> } = {}) {
    const res = await fetch(url, { method, headers: hdr(opts.headers), body: opts.body, cache: 'no-store' });
    if (!res.ok) throw new Error(`Supabase ${method} ${url.replace(URL_, '')} → ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}`);
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  }
  const coll = <T extends { id: string }>(table: string): Collection<T> => ({
    async list() { return (await call('GET', `${URL_}/rest/v1/${table}?select=data&limit=5000`)).map((r: { data: T }) => r.data); },
    async get(id) {
      const rows = await call('GET', `${URL_}/rest/v1/${table}?select=data&id=eq.${encodeURIComponent(id)}&limit=1`);
      return rows[0] ? rows[0].data : null;
    },
    async put(obj) {
      await call('POST', `${URL_}/rest/v1/${table}?on_conflict=id`, {
        body: JSON.stringify({ id: obj.id, data: obj }),
        headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      });
    },
    async del(id) { await call('DELETE', `${URL_}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`); },
  });
  return {
    name: `supabase (${URL_})`,
    products: coll<Product>('products'),
    orders: coll<Order>('orders'),
    couriers: coll<Courier>('couriers'),
    images: {
      async save(name, buf, mime) {
        await call('POST', `${URL_}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`, { body: new Uint8Array(buf), headers: { 'Content-Type': mime || typeOf(name), 'x-upsert': 'true' } });
      },
      async remove(name) { await call('DELETE', `${URL_}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`).catch(() => {}); },
      url: (name) => `${URL_}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`,
    },
  };
}

/* ---------------------------- FIREBASE ------------------------- */
async function firebaseStore(): Promise<Store> {
  const { initializeApp, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getStorage } = await import('firebase-admin/storage');
  const app = getApps()[0] ?? initializeApp();
  const db = getFirestore(app);
  try { db.settings({ ignoreUndefinedProperties: true }); } catch { /* already configured */ }

  let cfg: { projectId?: string; storageBucket?: string } = {};
  try { cfg = JSON.parse(process.env.FIREBASE_CONFIG || '{}'); } catch { /* ignore */ }
  const projectId = cfg.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || app.options.projectId;
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || cfg.storageBucket || (projectId ? `${projectId}.firebasestorage.app` : '');
  if (!bucketName) throw new Error('Firebase backend needs FIREBASE_STORAGE_BUCKET.');
  const bucket = getStorage(app).bucket(bucketName);

  const coll = <T extends { id: string }>(name: string): Collection<T> => ({
    async list() { return (await db.collection(name).get()).docs.map((d) => d.data() as T); },
    async get(id) { const d = await db.collection(name).doc(id).get(); return d.exists ? (d.data() as T) : null; },
    async put(obj) { await db.collection(name).doc(obj.id).set(obj as unknown as Record<string, unknown>); },
    async del(id) { await db.collection(name).doc(id).delete(); },
  });
  return {
    name: `firebase (${bucketName})`,
    products: coll<Product>('products'),
    orders: coll<Order>('orders'),
    couriers: coll<Courier>('couriers'),
    images: {
      async save(name, buf, mime) { await bucket.file(name).save(buf, { contentType: mime || typeOf(name), resumable: false }); },
      async remove(name) { await bucket.file(name).delete({ ignoreNotFound: true }).catch(() => {}); },
      url: (name) => `/uploads/${name}`,
      async read(name) { const [body] = await bucket.file(name).download(); return { body, type: typeOf(name) }; },
    },
  };
}

/* ----------------------------- entry --------------------------- */
const g = globalThis as unknown as { __efsStore?: Promise<Store> };

export function getStore(): Promise<Store> {
  if (!g.__efsStore) {
    const forced = (process.env.STORAGE_BACKEND || '').toLowerCase();
    g.__efsStore =
      forced === 'supabase' || (!forced && process.env.SUPABASE_URL) ? Promise.resolve(supabaseStore())
        : forced === 'firebase' || (!forced && (process.env.FIREBASE_CONFIG || process.env.K_SERVICE)) ? firebaseStore()
          : Promise.resolve(localStore());
    g.__efsStore.catch(() => { g.__efsStore = undefined; });
  }
  return g.__efsStore;
}
