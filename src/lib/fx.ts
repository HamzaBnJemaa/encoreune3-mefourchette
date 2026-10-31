/** Small DOM effects used by the storefront. */
const reduce = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function fly(from: HTMLElement, emoji: string) {
  if (reduce()) return;
  const target = (innerWidth < 900 ? document.getElementById('cartBar') : document.getElementById('cartBtn'));
  if (!target) return;
  const a = from.getBoundingClientRect(), t = target.getBoundingClientRect();
  const dot = document.createElement('div');
  dot.style.cssText = `position:fixed;z-index:300;left:${a.left + a.width / 2 - 20}px;top:${a.top + a.height / 2 - 20}px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--butter);border:2px solid var(--ink);font-size:20px;pointer-events:none`;
  dot.textContent = emoji;
  document.body.appendChild(dot);
  const dx = t.left + t.width / 2 - (a.left + a.width / 2), dy = t.top + t.height / 2 - (a.top + a.height / 2);
  dot.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(1.2)`, opacity: 1, offset: 0.45 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.4 },
  ], { duration: 750, easing: 'cubic-bezier(.5,0,.4,1)' }).onfinish = () => dot.remove();
}

export function confetti() {
  if (reduce()) return;
  const cols = ['#FFB300', '#FF7043', '#A5D6A7', '#FFD54F', '#1B5E20'];
  for (let i = 0; i < 46; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = cols[i % cols.length];
    document.body.appendChild(c);
    c.animate([{ transform: 'translateY(-20px) rotate(0)', opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * 200}px, 105vh) rotate(${Math.random() * 900}deg)`, opacity: 0.8 }], { duration: 1800 + Math.random() * 1600, delay: Math.random() * 400, easing: 'cubic-bezier(.3,.6,.5,1)' }).onfinish = () => c.remove();
  }
}
