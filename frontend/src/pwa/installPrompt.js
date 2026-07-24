// Boton flotante "Instalar app" (Android/Chrome via beforeinstallprompt)
// + instrucciones para iPhone (Safari no dispara el evento). Aislado del arbol React.
export function setupInstallPrompt() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (isStandalone) return; // ya esta instalada

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
  let deferred = null;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = '⬇  Instalar app';
  btn.setAttribute('aria-label', 'Instalar app');
  Object.assign(btn.style, {
    position: 'fixed',
    left: '50%',
    bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
    transform: 'translateX(-50%)',
    zIndex: '9999',
    padding: '12px 22px',
    border: 'none',
    borderRadius: '999px',
    background: '#8a1f24',
    color: '#fff',
    fontWeight: '700',
    fontSize: '15px',
    fontFamily: 'inherit',
    boxShadow: '0 10px 26px rgba(0,0,0,.28)',
    cursor: 'pointer',
    display: 'none',
  });
  document.body.appendChild(btn);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.textContent = '⬇  Instalar app';
    btn.style.display = 'block';
  });

  window.addEventListener('appinstalled', () => {
    btn.style.display = 'none';
    deferred = null;
  });

  btn.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch (e) { /* noop */ }
      deferred = null;
      btn.style.display = 'none';
    } else if (isIOS) {
      showIOSHint();
    }
  });

  // iPhone: no hay prompt nativo -> mostramos el boton con instrucciones
  if (isIOS) {
    btn.textContent = '⬇  Instalar en iPhone';
    btn.style.display = 'block';
  }

  function showIOSHint() {
    if (document.getElementById('pwa-ios-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'pwa-ios-overlay';
    Object.assign(ov.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '10000',
      background: 'rgba(0,0,0,.5)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    });
    const card = document.createElement('div');
    Object.assign(card.style, {
      background: '#fff',
      borderRadius: '18px 18px 0 0',
      padding: '22px',
      maxWidth: '440px',
      width: '100%',
      fontFamily: 'inherit',
      color: '#1f2937',
      boxShadow: '0 -8px 30px rgba(0,0,0,.3)',
    });
    card.innerHTML =
      '<div style="font-weight:800;font-size:18px;margin-bottom:10px">Instalar en iPhone</div>' +
      '<ol style="margin:0 0 16px 18px;padding:0;line-height:1.7;font-size:15px">' +
      '<li>Abrí esta página en <b>Safari</b>.</li>' +
      '<li>Tocá <b>Compartir</b> (el cuadrado con la flecha ↑).</li>' +
      '<li>Elegí <b>Agregar a inicio</b> y confirmá <b>Agregar</b>.</li>' +
      '</ol>' +
      '<button id="pwa-ios-close" type="button" style="width:100%;padding:13px;border:none;border-radius:12px;background:#8a1f24;color:#fff;font-weight:700;font-size:15px">Entendido</button>';
    ov.appendChild(card);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
    const close = document.getElementById('pwa-ios-close');
    if (close) close.addEventListener('click', () => ov.remove());
  }
}
