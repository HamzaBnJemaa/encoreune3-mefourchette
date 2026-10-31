'use client';
import { useEffect, useRef, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { api } from '@/lib/client';
import { useSheet } from '@/hooks/useSheet';
import { useBodyLock } from '@/hooks/useBodyLock';

const MAX_PHOTOS = 4;
type Photo = { kind: 'old'; file: string; url: string } | { kind: 'new'; blob: Blob | null; url: string; busy: boolean };
const num = (v: string) => Number(String(v).replace(',', '.').replace(/\s/g, ''));

/** Resize + recompress phone photos (4000px / 6 MB → ~1600px / ~300 KB) and fix EXIF rotation. */
async function compress(file: File, max = 1600, quality = 0.84): Promise<Blob> {
  let bmp: ImageBitmap | HTMLImageElement;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { bmp = await new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }); }
  const w = bmp.width, h = bmp.height, k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  if ('close' in bmp) bmp.close();
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/jpeg', quality));
}

type Props = { open: boolean; product: PublicProduct | null; categories: string[]; onClose: () => void; onSaved: (msg: string) => void };

export default function ProductEditor({ open, product, categories, onClose, onSaved }: Props) {
  const { mounted, on } = useSheet(open);
  useBodyLock(open);
  const [name, setName] = useState(''); const [cat, setCat] = useState(''); const [unit, setUnit] = useState('');
  const [price, setPrice] = useState(''); const [saleOn, setSaleOn] = useState(false); const [sale, setSale] = useState('');
  const [desc, setDesc] = useState(''); const [avail, setAvail] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const cam = useRef<HTMLInputElement>(null); const gal = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLFormElement>(null);

  // reset the form whenever the editor opens
  useEffect(() => {
    if (!open) return;
    const p = product;
    setName(p?.name || ''); setCat(p?.category || ''); setUnit(p?.unit || ''); setPrice(p ? String(p.price) : '');
    setSaleOn(p?.salePrice != null); setSale(p?.salePrice != null ? String(p.salePrice) : ''); setDesc(p?.description || ''); setAvail(p ? p.available : true);
    setPhotos((p?.images || []).map((url) => ({ kind: 'old', file: url.split('/').pop() || '', url })));
    setErr(''); setBusy(false);
  }, [open, product]);

  const pctOff = saleOn && num(price) > 0 && sale.trim() && num(sale) >= 0 && num(sale) < num(price) ? `-${Math.round((1 - num(sale) / num(price)) * 100)}%` : '';

  async function addFiles(list: FileList | null) {
    const files = [...(list || [])].slice(0, MAX_PHOTOS - photos.length);
    for (const f of files) {
      const url = URL.createObjectURL(f);
      const ph: Photo = { kind: 'new', blob: null, url, busy: true };
      setPhotos((x) => [...x, ph]);
      try {
        const blob = await compress(f);
        const nu = URL.createObjectURL(blob); URL.revokeObjectURL(url);
        setPhotos((x) => x.map((q) => (q === ph ? { kind: 'new', blob, url: nu, busy: false } : q)));
      } catch {
        setPhotos((x) => x.filter((q) => q !== ph));
        setErr('Photo illisible, essayez-en une autre.');
      }
    }
  }
  const removePhoto = (i: number) => setPhotos((x) => { const r = x[i]; if (r.kind === 'new') URL.revokeObjectURL(r.url); return x.filter((_, k) => k !== i); });
  const makeFirst = (i: number) => setPhotos((x) => [x[i], ...x.filter((_, k) => k !== i)]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const fail = (m: string) => { setErr(m); bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }); };
    const p = num(price);
    if (!name.trim()) return fail('Le nom est obligatoire.');
    if (!price.trim() || !(p >= 0)) return fail('Indiquez un prix valide.');
    if (saleOn && (!sale.trim() || !(num(sale) >= 0) || num(sale) >= p)) return fail('Le prix promo doit être inférieur au prix normal.');
    if (photos.some((x) => x.kind === 'new' && x.busy)) return fail('Patientez, les photos se préparent…');

    const fd = new FormData();
    fd.append('name', name.trim()); fd.append('category', cat.trim()); fd.append('unit', unit.trim());
    fd.append('price', price.trim()); fd.append('salePrice', saleOn ? sale.trim() : ''); fd.append('description', desc.trim());
    fd.append('available', avail ? 'true' : 'false');
    let n = 0;
    fd.append('layout', JSON.stringify(photos.map((x) => (x.kind === 'old' ? x.file : '#' + n++))));
    photos.forEach((x, i) => { if (x.kind === 'new' && x.blob) fd.append('images', x.blob, `photo-${i}.jpg`); });
    setBusy(true);
    try {
      await api(product ? `/api/admin/products/${product.id}` : '/api/admin/products', { method: product ? 'PUT' : 'POST', body: fd });
      onSaved(product ? 'Article mis à jour ✓' : 'Article publié ✓');
    } catch (ex) { fail(ex instanceof Error ? ex.message : 'Erreur'); }
    setBusy(false);
  }

  if (!mounted) return null;
  const slots = Math.max(0, MAX_PHOTOS - photos.length);
  return (
    <>
      <div className={`overlay${on ? ' is-on' : ''}`} onClick={onClose} />
      <section className={`editor${on ? ' is-on' : ''}`} role="dialog" aria-modal="true" aria-labelledby="eTitle">
        <header className="editor__head"><h2 className="display" id="eTitle">{product ? 'Modifier l’article' : 'Nouvel article'}</h2><button className="iconbtn" onClick={onClose} aria-label="Fermer">✕</button></header>
        <form className="editor__body" id="eForm" onSubmit={submit} noValidate ref={bodyRef} data-lenis-prevent>
          <div className="field">
            <span>Photos <small>(jusqu’à 4 — la première est la couverture)</small></span>
            <div className="photos">
              {photos.map((p, i) => (
                <div key={p.url} className={`ph${i === 0 ? ' is-cover' : ''}${p.kind === 'new' && p.busy ? ' is-busy' : ''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Photo ${i + 1}`} />
                  <button type="button" className="ph__x" onClick={() => removePhoto(i)} aria-label="Retirer la photo">✕</button>
                  {i > 0 && <button type="button" className="ph__mv" onClick={() => makeFirst(i)} aria-label="Mettre en premier" title="Mettre en premier">★</button>}
                </div>
              ))}
              {Array.from({ length: slots }, (_, i) => <div key={`s${i}`} className="ph ph--slot">＋</div>)}
            </div>
            <div className="photo-actions">
              <button type="button" className="btn btn--sm btn--amber" disabled={photos.length >= MAX_PHOTOS} onClick={() => cam.current?.click()}>📷 Prendre une photo</button>
              <button type="button" className="btn btn--sm btn--paper" disabled={photos.length >= MAX_PHOTOS} onClick={() => gal.current?.click()}>🖼️ Choisir dans la galerie</button>
            </div>
            <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            <input ref={gal} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>

          <div className="field"><label htmlFor="e-name">Nom de l’article</label><input className="input" id="e-name" maxLength={80} placeholder="Ex : Croissants beurre" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="row2">
            <div className="field"><label htmlFor="e-cat">Catégorie</label><input className="input" id="e-cat" list="cats" maxLength={40} placeholder="Ex : Viennoiseries" value={cat} onChange={(e) => setCat(e.target.value)} /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></div>
            <div className="field"><label htmlFor="e-unit">Unité / quantité</label><input className="input" id="e-unit" maxLength={30} placeholder="Ex : la pièce, le bocal 250 g" value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
          </div>
          <div className="row2">
            <div className="field"><label htmlFor="e-price">Prix (DT)</label><input className="input" id="e-price" inputMode="decimal" placeholder="Ex : 3.5" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div className="field"><span>Promotion</span><label className="switch"><input type="checkbox" checked={saleOn} onChange={(e) => setSaleOn(e.target.checked)} /><i /><b>En promo</b></label></div>
          </div>
          {saleOn && (
            <div className="field sale"><label htmlFor="e-sale">Prix promo (DT)</label>
              <div className="sale__row"><input className="input" id="e-sale" inputMode="decimal" placeholder="Ex : 3" autoFocus value={sale} onChange={(e) => setSale(e.target.value)} /><span className="sale__pct">{pctOff}</span></div>
            </div>
          )}
          <div className="field"><label htmlFor="e-desc">Description</label><textarea className="textarea" id="e-desc" maxLength={800} rows={4} placeholder="Ingrédients, goût, conseils…" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <label className="switch"><input type="checkbox" checked={avail} onChange={(e) => setAvail(e.target.checked)} /><i /><b>Disponible à la vente</b></label>
          {err && <div className="form__err">{err}</div>}
        </form>
        <footer className="editor__foot">
          <button className="btn btn--ghost" type="button" onClick={onClose}>Annuler</button>
          <button className="btn btn--lg" type="submit" form="eForm" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </footer>
      </section>
    </>
  );
}
