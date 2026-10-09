/* The static AI-secretary landing page uses the same GA4 ID and contact event
   as the React site, without shipping a React runtime for analytics. */
(() => {
  const id = document.currentScript?.dataset.gaId;
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[href^="tel:"],a[href^="mailto:"]');
    if (link) window.gtag('event', 'contact_tap', {
      method: link.getAttribute('href').startsWith('tel:') ? 'phone' : 'email',
      page_path: window.location.pathname,
    });
  }, true);
  const load = () => {
    const insert = () => {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      script.async = true;
      document.head.appendChild(script);
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(insert, { timeout: 2000 });
    else setTimeout(insert, 0);
  };
  if (document.readyState === 'complete') load();
  else window.addEventListener('load', load, { once: true });
})();
