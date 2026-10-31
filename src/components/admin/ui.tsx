'use client';
import { useSheet } from '@/hooks/useSheet';
import { useBodyLock } from '@/hooks/useBodyLock';

/** Centered dialog card with overlay (used for small forms / confirmations). */
export function Modal({ open, onClose, title, children, dismissible = true }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; dismissible?: boolean }) {
  const { mounted, on } = useSheet(open, 450);
  useBodyLock(open);
  if (!mounted) return null;
  return (
    <>
      <div className={`overlay${on ? ' is-on' : ''}`} onClick={dismissible ? onClose : undefined} />
      <div className={`modal-card${on ? ' is-on' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="display">{title}</h2>
        {children}
      </div>
    </>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className={`field${error ? ' is-error' : ''}`}><label>{label}</label>{children}{error && <span className="err">{error}</span>}</div>;
}
