/* Progressive enhancement: content is visible without JS; no animation loop. */
(() => {
  const root = document.querySelector('[data-secretary-page]');
  const toggle = root?.querySelector('[data-motion-toggle]');
  if (!root || !toggle || root.dataset.enhanced) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  let paused = false;
  const apply = () => {
    const enabled = !paused && !preference.matches && !document.hidden;
    root.dataset.motion = enabled ? 'on' : 'off';
    toggle.disabled = preference.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = preference.matches ? '動きを抑えています' : paused ? '動きを再生する ▷' : '動きを止める Ⅱ';
    if (!enabled) {
      animations.forEach(animation => animation.cancel());
      animations.clear();
    }
  };
  root.dataset.enhanced = 'true';
  toggle.addEventListener('click', () => { paused = !paused; apply(); });
  preference.addEventListener('change', apply);
  document.addEventListener('visibilitychange', apply);
  apply();
  if (!('IntersectionObserver' in window)) return;
  const targets = root.querySelectorAll('[data-motion-section], [data-enter], [data-motion-scene]');
  // Never fade first-view content out when the enhancement script arrives.
  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < innerHeight && rect.bottom > 0) el.dataset.entered = 'true';
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      target.dataset.visible = String(isIntersecting);
      if (!isIntersecting || target.dataset.entered) return;
      target.dataset.entered = 'true';
      if (root.dataset.motion !== 'on' || !target.animate) return;
      const animation = target.animate([
        { opacity: .35, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
    });
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
  targets.forEach(el => observer.observe(el));
})();
