'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PublicProduct } from '@/lib/types';
import { emojiFor, money } from '@/lib/client';
import { fly } from '@/lib/fx';
import { useCart } from '@/hooks/useCart';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import CartDrawer from './CartDrawer';

const CAT_ORDER = ['Viennoiseries', 'Pâtisseries', 'Salé', 'Traditionnel', 'Bocaux'];
const MARQUEE = ['Croissants', 'Shnecks', 'Petits gâteaux', 'Dro3 cake', 'Harissa', 'Bssissa', 'Confitures', 'Sablés', 'Brownies', 'Recettes tunisiennes', 'Mini pizzas', 'Merguez'];
const MARQUEE_SEP = (
  <svg className="marquee__sep" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M13.67 2c-.53 0-.95.42-.95.94v3.7a.49.49 0 0 1-.98 0V2.98c0-.52-.4-.97-.91-.98a.94.94 0 0 0-.97.94v3.7a.49.49 0 0 1-.98 0V2.98c0-.52-.4-.97-.91-.98a.94.94 0 0 0-.97.94v6.32a3.8 3.8 0 0 0 1.503 3.034c.847.62.847 2.617.847 2.617v13.8c0 .71.58 1.29 1.29 1.29h.32c.71 0 1.29-.58 1.29-1.29V14.9s0-2.037.834-2.607A3.8 3.8 0 0 0 14.6 9.251V2.94a.924.924 0 0 0-.93-.94m9.39 0c1.24 0 2.24 1 2.24 2.24v13.65l-.01-.003v10.814c0 .71-.58 1.29-1.29 1.29h-.32c-.71 0-1.29-.58-1.29-1.29V16.837a4.35 4.35 0 0 1-2.55-3.966V5.22C19.83 3.44 21.28 2 23.06 2" fill="currentColor" />
  </svg>
);

export default function Shop({ products }: { products: PublicProduct[] }) {
  const scrollTo = useSmoothScroll();
  const { cart, setQty, clear, count, subtotal, shipping, total, saving } = useCart(products);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [modalId, setModalId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [bump, setBump] = useState(0);
  const lastY = useRef(0);

  const cats = useMemo(() => {
    const set = [...new Set(products.map((p) => p.category))];
    return set.sort((a, b) => { const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'fr'); });
  }, [products]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (category === 'all' || p.category === category) && (!q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q)));
  }, [products, category, query]);

  /* nav state + hero parallax */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        setHidden((h) => (y > 500 && y > lastY.current + 6 && !document.documentElement.classList.contains('locked') ? true : y < lastY.current - 6 || y < 500 ? false : h));
        lastY.current = y;
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    return () => removeEventListener('scroll', onScroll);
  }, []);

  /* reveal on scroll */
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal:not(.in), .card:not(.in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [list]);

  /* in-page links (#carte, #commander…) → smooth scroll */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      e.preventDefault(); scrollTo(a.getAttribute('href') || '#top');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [scrollTo]);

  /* esc closes layers; cart bump */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setModalId(null); setCartOpen(false); } };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, []);

  const onAdd = useCallback((el: HTMLElement, p: PublicProduct) => { fly(el, emojiFor(p)); setBump((b) => b + 1); }, []);
  const modalProduct = products.find((p) => p.id === modalId) || null;
  const openCart = () => { setModalId(null); setCartOpen(true); };

  return (
    <>
      {/* NAV */}
      <header className={`nav${scrolled ? ' is-scrolled' : ''}${hidden ? ' is-hidden' : ''}`} id="nav">
        <a className="nav__brand" href="#top" aria-label="Encore Une 3ème Fourchette — accueil">
          <img className="nav__logo" src="/3f.png" alt="Encore Une 3ème Fourchette" />
          <span className="nav__name display">Encore une<br />3ème fourchette</span>
        </a>
        <nav className="nav__links" aria-label="Navigation">
          <a href="#carte">La carte</a><a href="#commander">Comment commander</a><a href="#propos">Notre histoire</a>
        </nav>
        <button className={`cartbtn${bump ? ' is-bump' : ''}`} key={`b${bump}`} id="cartBtn" aria-label="Ouvrir le panier" onClick={openCart}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7Z" /><path d="M9 7V6a3 3 0 0 1 6 0v1" /></svg>
          <span className="cartbtn__label">Panier</span>
          <b className="cartbtn__count">{count}</b>
        </button>
      </header>

      <main id="top">
        {/* HERO */}
        <section className="hero" id="hero">
          <div className="hero__grain" aria-hidden="true" />
          <span className="blob blob--amber" data-speed="0.12" aria-hidden="true" />
          <span className="blob blob--coral" data-speed="-0.08" aria-hidden="true" />
          <span className="blob blob--mint" data-speed="0.2" aria-hidden="true" />
          <img className="float float--1" data-speed="-0.16" src="/croissant.png" alt="" aria-hidden="true" />
          <img className="float float--2" data-speed="0.1" src="/chili.png" alt="" aria-hidden="true" />
          <img className="float float--3" data-speed="-0.22" src="/gateau.png" alt="" aria-hidden="true" />
          <img className="float float--4" data-speed="0.18" src="/cookie.png" alt="" aria-hidden="true" />
          <img className="float float--5" data-speed="0.15" src="/pizza.png" alt="" aria-hidden="true" />
          <img className="float float--6" data-speed="-0.12" src="/brownie.png" alt="" aria-hidden="true" />
          <div className="hero__inner">
            <h1 className="hero__title display" aria-label="Encore une 3ème fourchette">
              <span className="line"><span className="w w--butter">Encore</span> <span className="w w--butter">une</span></span>
              <span className="line"><span className="w w--pill">3ème</span></span>
              <span className="line"><span className="w w--mint">fourchette</span></span>
            </h1>
            <div className="hero__row">
              <p className="hero__lead">Croissants dorés, petits gâteaux, harissa qui pique juste ce qu’il faut, merguez, recettes de grand-mère… Choisissez, remplissez votre panier, on s’occupe du reste.</p>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="marquee" aria-hidden="true">
          <div className="marquee__track display">
            {[0, 1].flatMap((k) => MARQUEE.flatMap((m, i) => [<span key={`${k}-${i}`}>{m}</span>, <span key={`${k}-${i}i`} className="marquee__sep">{MARQUEE_SEP}</span>]))}
          </div>
        </div>

        {/* MENU */}
        <section className="menu" id="carte">
          <div className="wrap">
            <div className="menu__head reveal">
              <h2 className="display">La carte{products.length > 0 && <span className="menu__count">{products.length}</span>}</h2>
              <p>Tout est préparé en petites quantités, avec des produits choisis. Touchez un article pour le détail.</p>
            </div>
          </div>
          <div className="filters">
            <div className="wrap filters__inner">
              <div className="chips" role="tablist" aria-label="Catégories">
                <button className="chip" role="tab" aria-selected={category === 'all'} onClick={() => setCategory('all')}>Tout<small>{products.length}</small></button>
                {cats.map((c) => (
                  <button key={c} className="chip" role="tab" aria-selected={category === c} onClick={(e) => { setCategory(c); e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }}>
                    {c}<small>{products.filter((p) => p.category === c).length}</small>
                  </button>
                ))}
              </div>
              <label className="search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <span className="sr-only">Rechercher</span>
                <input type="search" placeholder="Rechercher un délice…" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
            </div>
          </div>
          <div className="wrap">
            <div className="grid" aria-live="polite">
              {list.map((p, i) => <ProductCard key={p.id} p={p} index={i} qty={cart[p.id] || 0} setQty={setQty} onOpen={setModalId} onAdd={onAdd} />)}
            </div>
            {list.length === 0 && (
              <div className="empty">
                <img className="empty__img" src="/grandmother6.png" alt="" />
                <h3 className="display">{products.length ? 'Aucun résultat' : 'La cuisine chauffe…'}</h3>
                <p>{products.length ? 'Essayez un autre mot ou une autre catégorie.' : 'Les premiers délices arrivent très bientôt. Revenez nous voir !'}</p>
              </div>
            )}
          </div>
        </section>

        {/* HOW */}
        <section className="how" id="commander">
          <div className="wrap">
            <h2 className="display reveal">Commander,<br />c’est simple.</h2>
            <ol className="how__list">
              <li className="how__card how__card--1 reveal">
                <img className="how__img" src="/grandmother1.png" alt="" />
                <div className="how__content">
                  <b className="display">1</b>
                  <h3 className="display">Choisissez</h3>
                  <p>Parcourez la carte et ajoutez vos envies au panier, autant que vous voulez.</p>
                </div>
              </li>
              <li className="how__card how__card--2 reveal">
                <img className="how__img" src="/grandmother2.png" alt="" />
                <div className="how__content">
                  <b className="display">2</b>
                  <h3 className="display">Remplissez</h3>
                  <p>Votre nom, votre numéro et votre adresse. Pas de compte à créer.</p>
                </div>
              </li>
              <li className="how__card how__card--3 reveal">
                <img className="how__img" src="/grandmother3.png" alt="" />
                <div className="how__content">
                  <b className="display">3</b>
                  <h3 className="display">Savourez</h3>
                  <p>Votre commande arrive directement en cuisine, on vous appelle pour confirmer.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* ABOUT */}
        <section className="about" id="propos">
          <div className="wrap about__inner">
            <h2 className="display reveal">Une cuisine<br />qui<br />en redemande.</h2>
            <div className="about__text reveal">
              <p className="about__lead">
                <span className="about__brand">Encore Une 3ème Fourchette</span>
                <span className="about__quote about__quote--after" aria-hidden="true">
                  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M0 0h32v32H0z" fill="none" /><path fill="currentColor" d="M13.67 2c-.53 0-.95.42-.95.94v3.7a.49.49 0 0 1-.98 0V2.98c0-.52-.4-.97-.91-.98a.94.94 0 0 0-.97.94v3.7a.49.49 0 0 1-.98 0V2.98c0-.52-.4-.97-.91-.98a.94.94 0 0 0-.97.94v6.32a3.8 3.8 0 0 0 1.503 3.034c.847.62.847 2.617.847 2.617v13.8c0 .71.58 1.29 1.29 1.29h.32c.71 0 1.29-.58 1.29-1.29V14.9s0-2.037.834-2.607A3.8 3.8 0 0 0 14.6 9.251V2.94a.924.924 0 0 0-.93-.94m9.39 0c1.24 0 2.24 1 2.24 2.24v13.65l-.01-.003v10.814c0 .71-.58 1.29-1.29 1.29h-.32c-.71 0-1.29-.58-1.29-1.29V16.837a4.35 4.35 0 0 1-2.55-3.966V5.22C19.83 3.44 21.28 2 23.06 2" /></svg>
                  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M0 0h32v32H0z" fill="none" /><path fill="currentColor" d="M13.67 2c-.53 0-.95.42-.95.94v3.7a.49.49 0 0 1-.98 0V2.98c0-.52-.4-.97-.91-.98a.94.94 0 0 0-.97.94v3.7a.49.49 0 0 1-.98 0V2.98c0-.52-.4-.97-.91-.98a.94.94 0 0 0-.97.94v6.32a3.8 3.8 0 0 0 1.503 3.034c.847.62.847 2.617.847 2.617v13.8c0 .71.58 1.29 1.29 1.29h.32c.71 0 1.29-.58 1.29-1.29V14.9s0-2.037.834-2.607A3.8 3.8 0 0 0 14.6 9.251V2.94a.924.924 0 0 0-.93-.94m9.39 0c1.24 0 2.24 1 2.24 2.24v13.65l-.01-.003v10.814c0 .71-.58 1.29-1.29 1.29h-.32c-.71 0-1.29-.58-1.29-1.29V16.837a4.35 4.35 0 0 1-2.55-3.966V5.22C19.83 3.44 21.28 2 23.06 2" /></svg>
                  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M0 0h32v32H0z" fill="none" /><path fill="currentColor" d="M13.67 2c-.53 0-.95.42-.95.94v3.7a.49.49 0 0 1-.98 0V2.98c0-.52-.4-.97-.91-.98a.94.94 0 0 0-.97.94v3.7a.49.49 0 0 1-.98 0V2.98c0-.52-.4-.97-.91-.98a.94.94 0 0 0-.97.94v6.32a3.8 3.8 0 0 0 1.503 3.034c.847.62.847 2.617.847 2.617v13.8c0 .71.58 1.29 1.29 1.29h.32c.71 0 1.29-.58 1.29-1.29V14.9s0-2.037.834-2.607A3.8 3.8 0 0 0 14.6 9.251V2.94a.924.924 0 0 0-.93-.94m9.39 0c1.24 0 2.24 1 2.24 2.24v13.65l-.01-.003v10.814c0 .71-.58 1.29-1.29 1.29h-.32c-.71 0-1.29-.58-1.29-1.29V16.837a4.35 4.35 0 0 1-2.55-3.966V5.22C19.83 3.44 21.28 2 23.06 2" /></svg>
                </span>
                c’est cette petite voix qui dit <em>« juste une dernière bouchée »</em>… et on se ressert. Ici, on cuisine comme à la maison : du beurre, du temps, des épices qui sentent bon, et jamais de raccourci.
              </p>
              <p>Des viennoiseries du matin aux bocaux de harissa et de confiture, en passant par les recettes tunisiennes qu’on se transmet : chaque commande est préparée avec soin.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer__brand" aria-label="Encore Une 3ème Fourchette">
            <div className="footer__word display" aria-hidden="true">Encore une 3ème fourchette</div>
          </div>
          <div className="footer__row">
            <p>© {new Date().getFullYear()} Encore Une 3ème Fourchette · Fait maison avec amour</p>
            <span><a href="/admin" className="footer__admin">Espace admin</a></span>
          </div>
        </div>
      </footer>

      {/* floating cart bar (phone / tablet) */}
      <button className={`cartbar${count > 0 && !cartOpen && !modalId ? ' is-on' : ''}`} id="cartBar" onClick={openCart} aria-label="Voir mon panier">
        <span className="cartbar__count">{count}</span>
        <span className="cartbar__text">Voir mon panier</span>
        <b className="cartbar__total display">{money(total)}</b>
      </button>

      <ProductModal product={modalProduct} qty={modalProduct ? cart[modalProduct.id] || 0 : 0} setQty={setQty} onAdd={onAdd} onClose={() => setModalId(null)} onGoCart={openCart} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} products={products} cart={cart} setQty={setQty} subtotal={subtotal} shipping={shipping} total={total} saving={saving} onOrdered={clear} />
    </>
  );
}
