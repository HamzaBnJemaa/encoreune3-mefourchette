import { clearSession } from '@/lib/auth';
import { json } from '@/lib/server-utils';

export async function POST() {
  return clearSession(json({ ok: true }));
}
