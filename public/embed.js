(function () {
  'use strict';

  // ── 1. Find the script tag ────────────────────────────────────────────────
  var script = null;
  var scripts = document.getElementsByTagName('script');
  for (var i = scripts.length - 1; i >= 0; i--) {
    if (scripts[i].getAttribute('data-shop')) { script = scripts[i]; break; }
  }
  if (!script) return;

  var slug = script.getAttribute('data-shop');
  if (!slug) return;

  var src    = script.getAttribute('src') || '';
  var baseUrl = src.replace(/\/embed\.js.*$/, '').replace(/\/$/, '') || 'https://aibotbanao.com';
  var chatUrl = baseUrl + '/chat/' + slug;
  var logoUrl = baseUrl + '/newlogo.png';

  // ── 2. Detect local / dev environment ───────────────────────────────────
  var isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(baseUrl);

  var isOpen      = false;
  var iframeReady = false;

  // ── 3. Styles ─────────────────────────────────────────────────────────────
  var S = document.createElement('style');
  S.textContent =
    // Button
    '#_abb-btn{position:fixed;bottom:24px;right:24px;width:60px;height:60px;' +
    'border-radius:50%;background:transparent;border:none;cursor:pointer;' +
    'box-shadow:0 4px 24px rgba(0,0,0,.22);display:flex;align-items:center;' +
    'justify-content:center;z-index:2147483646;transition:transform .2s,box-shadow .2s;' +
    'padding:0;overflow:hidden;}' +
    '#_abb-btn:hover{transform:scale(1.08);box-shadow:0 8px 28px rgba(0,0,0,.24);}' +
    '#_abb-btn img{width:60px;height:60px;object-fit:cover;border-radius:50%;display:block;}' +
    '#_abb-btn svg{width:24px;height:24px;fill:#374151;display:block;}' +
    // Box
    '#_abb-box{position:fixed;bottom:96px;right:24px;width:380px;height:580px;' +
    'max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);' +
    'border-radius:20px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.2);' +
    'border:1px solid rgba(0,0,0,.07);z-index:2147483645;background:#f9fafb;' +
    'display:none;flex-direction:column;' +
    'transition:opacity .18s,transform .18s;opacity:0;transform:scale(.96) translateY(10px);}' +
    '#_abb-box.open{display:flex;}' +
    '#_abb-box.visible{opacity:1;transform:scale(1) translateY(0);}' +
    '#_abb-box iframe{width:100%;flex:1;border:none;display:block;}' +
    // Dev panel
    '#_abb-dev{flex:1;display:flex;flex-direction:column;align-items:center;' +
    'justify-content:center;padding:28px 24px;text-align:center;' +
    'font-family:system-ui,-apple-system,sans-serif;background:#fff;gap:0;}' +
    '#_abb-dev img{width:52px;height:52px;border-radius:10px;margin-bottom:14px;}' +
    '#_abb-dev ._abb-badge{display:inline-flex;align-items:center;gap:6px;' +
    'background:#fef9c3;color:#854d0e;font-size:11px;font-weight:700;' +
    'padding:4px 10px;border-radius:999px;margin-bottom:14px;letter-spacing:.4px;}' +
    '#_abb-dev ._abb-badge span{width:6px;height:6px;border-radius:50%;' +
    'background:#ca8a04;display:inline-block;}' +
    '#_abb-dev h3{font-size:15px;font-weight:700;color:#111827;margin:0 0 8px;}' +
    '#_abb-dev p{font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 20px;}' +
    '#_abb-dev ._abb-url{font-size:11px;font-family:monospace;background:#f3f4f6;' +
    'color:#374151;padding:6px 10px;border-radius:6px;word-break:break-all;' +
    'margin-bottom:20px;max-width:100%;display:block;}' +
    '#_abb-dev ._abb-open{display:inline-flex;align-items:center;gap:6px;' +
    'background:#16a34a;color:#fff;font-size:13px;font-weight:600;' +
    'padding:10px 18px;border-radius:10px;border:none;cursor:pointer;' +
    'text-decoration:none;transition:background .15s;}' +
    '#_abb-dev ._abb-open:hover{background:#15803d;}' +
    '#_abb-dev ._abb-note{font-size:11px;color:#9ca3af;margin-top:14px;line-height:1.5;}';
  document.head.appendChild(S);

  // ── 4. DOM elements ───────────────────────────────────────────────────────
  var LOGO_IMG  = '<img src="' + logoUrl + '" alt="AIBotBanao" />';
  var CLOSE_SVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>' +
    '</svg>';

  var btn = document.createElement('button');
  btn.id = '_abb-btn';
  btn.setAttribute('aria-label', 'Chat kholein');
  btn.innerHTML = LOGO_IMG;

  var box = document.createElement('div');
  box.id = '_abb-box';

  document.body.appendChild(box);
  document.body.appendChild(btn);

  // ── 5. Dev-mode panel (shown immediately on localhost) ────────────────────
  function buildDevPanel() {
    var d = document.createElement('div');
    d.id = '_abb-dev';
    d.innerHTML =
      LOGO_IMG +
      '<div class="_abb-badge"><span></span>Development Mode</div>' +
      '<h3>Widget preview</h3>' +
      '<p>Localhost URLs don\'t work inside iframes on external sites.<br>' +
      'Chat page seedha new tab mein khul sakta hai:</p>' +
      '<code class="_abb-url">' + chatUrl + '</code>' +
      '<a class="_abb-open" href="' + chatUrl + '" target="_blank" rel="noopener">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
      '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>' +
      'Chat new tab mein kholo' +
      '</a>' +
      '<p class="_abb-note">Production deploy ke baad widget iframes mein bhi kaam karega.<br>' +
      'Network IP use karein (192.168.x.x) agar same Wi-Fi par test karna ho.</p>';
    box.appendChild(d);
  }

  // ── 6. Production iframe ──────────────────────────────────────────────────
  function buildIframe() {
    var iframe = document.createElement('iframe');
    iframe.setAttribute('allow', 'microphone');
    iframe.setAttribute('title', 'AIBotBanao Chat');
    iframe.src = chatUrl;
    box.appendChild(iframe);
  }

  // ── 7. Toggle ──────────────────────────────────────────────────────────────
  btn.addEventListener('click', function () {
    isOpen = !isOpen;

    if (isOpen) {
      box.classList.add('open');
      requestAnimationFrame(function () { box.classList.add('visible'); });

      if (!iframeReady) {
        if (isLocal) {
          buildDevPanel();   // show dev panel immediately, skip iframe
        } else {
          buildIframe();     // production: load real iframe
        }
        iframeReady = true;
      }

      btn.innerHTML = CLOSE_SVG;
      btn.setAttribute('aria-label', 'Chat band karein');
    } else {
      box.classList.remove('visible');
      box.addEventListener('transitionend', function handler() {
        box.classList.remove('open');
        box.removeEventListener('transitionend', handler);
      });
      btn.innerHTML = LOGO_IMG;
      btn.setAttribute('aria-label', 'Chat kholein');
    }
  });
})();
