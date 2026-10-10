import { mountStudioMotion, mountStudioParticles } from './studio-motion.js';

const root = document.querySelector('[data-secretary-page]');
if (root && !root.dataset.enhanced) {
  root.dataset.enhanced = 'true';
  const toggle = root.querySelector('[data-motion-toggle]');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => {
    if (!toggle) return;
    const paused = root.dataset.motionPaused === 'true';
    toggle.disabled = preference.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = preference.matches ? '動きを抑えています' : paused ? '動きを再生する ▷' : '動きを止める Ⅱ';
  };
  root.addEventListener('studio-motion', update);
  toggle?.addEventListener('click', () => {
    root.dataset.motionPaused = String(root.dataset.motionPaused !== 'true');
    root.dispatchEvent(new Event('studio-motion-toggle'));
  });
  mountStudioMotion(root, 'page');
  root.querySelectorAll('canvas[data-studio-particles]').forEach(mountStudioParticles);
  update();
}
