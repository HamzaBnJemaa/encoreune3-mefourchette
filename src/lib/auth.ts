import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getStore } from './store';
import type { Courier, PublicCourier } from './types';

export const ADMIN_USER = (process.env.ADMIN_USER || 'sonia').trim();
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'titourita';
// "__session" is the only cookie Firebase's CDN forwards to the server, so we use that name.
export const COOKIE = '__session';
export const SESSION_MS = 365 * 24 * 3600 * 1000; // stay logged in for a year

// Derived from the credentials when SESSION_SECRET is unset → sessions survive restarts/redeploys.
const SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update(`efs|${ADMIN_USER}|${ADMIN_PASSWORD}`).digest('hex');

export type Session = { r: 'admin' | 'courier'; u: string; i?: string; v?: number; exp: number };

const sha = (s: string) => crypto.createHash('sha256').update(String(s)).digest();
export const safeEqual = (a: string, b: string) => crypto.timingSafeEqual(sha(a), sha(b));

function sign(payload: Session) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}
function verify(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

export function readCookie(header: string | null | undefined, name = COOKIE) {
  for (const part of (header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) { try { return decodeURIComponent(part.slice(i + 1).trim()); } catch { return undefined; } }
  }
  return undefined;
}
export const sessionFrom = (req: Request) => verify(readCookie(req.headers.get('cookie')));

export function setSession(req: Request, res: NextResponse, s: Omit<Session, 'exp'>) {
  const secure = new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  res.cookies.set({ name: COOKIE, value: sign({ ...s, exp: Date.now() + SESSION_MS }), httpOnly: true, sameSite: 'lax', path: '/', maxAge: SESSION_MS / 1000, secure });
  return res;
}
export function clearSession(res: NextResponse) {
  res.cookies.set({ name: COOKIE, value: '', httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}

/* ---- passwords (scrypt) ---- */
export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}
export function checkPassword(pw: string, stored: string) {
  const [alg, saltHex, hashHex] = String(stored).split('$');
  if (alg !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const got = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(got, expected);
}
export const publicCourier = ({ passHash: _p, pv: _v, ...rest }: Courier): PublicCourier => rest;

/* ---- guards ---- */
const unauthorized = () => NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

export function adminGuard(req: Request): Session | NextResponse {
  const s = sessionFrom(req);
  return s && s.r === 'admin' ? s : unauthorized();
}
export async function courierGuard(req: Request): Promise<{ courier: Courier } | NextResponse> {
  const s = sessionFrom(req);
  if (!s || s.r !== 'courier' || !s.i) return unauthorized();
  const store = await getStore();
  const courier = await store.couriers.get(s.i);
  // deleted account or password reset → session is void
  if (!courier || courier.pv !== s.v) return unauthorized();
  return { courier };
}

/* ---- tiny in-memory rate limiter + helpers ---- */
const buckets = (globalThis as unknown as { __efsRL?: Map<string, { n: number; reset: number }> });
buckets.__efsRL ??= new Map();
export function rateLimited(req: Request, scope: string, max: number, windowMs: number) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const key = `${scope}:${ip}`;
  const now = Date.now();
  let h = buckets.__efsRL!.get(key);
  if (!h || h.reset < now) h = { n: 0, reset: now + windowMs };
  h.n++;
  buckets.__efsRL!.set(key, h);
  return h.n > max;
}
export const tooMany = () => NextResponse.json({ error: 'Trop de tentatives, réessayez plus tard.' }, { status: 429 });
export const isResponse = (x: unknown): x is NextResponse => x instanceof NextResponse;
