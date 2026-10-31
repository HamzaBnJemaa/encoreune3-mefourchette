'use client';
import { useCallback, useState } from 'react';

type T = { id: number; msg: string; error?: boolean; out?: boolean };
export function useToasts() {
  const [list, setList] = useState<T[]>([]);
  const toast = useCallback((msg: string, type?: 'error') => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, msg, error: type === 'error' }]);
    setTimeout(() => setList((l) => l.map((x) => (x.id === id ? { ...x, out: true } : x))), 2700);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3100);
  }, []);
  const view = (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => <div key={t.id} className={`toast${t.error ? ' toast--error' : ''}${t.out ? ' is-out' : ''}`}>{t.msg}</div>)}
    </div>
  );
  return { toast, toastView: view };
}
