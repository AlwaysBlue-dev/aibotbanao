(function () {
  'use strict';

  // Find the script tag that loaded this file
  var script = null;
  var scripts = document.getElementsByTagName('script');
  for (var i = scripts.length - 1; i >= 0; i--) {
    if (scripts[i].getAttribute('data-shop')) {
      script = scripts[i];
      break;
    }
  }
  if (!script) return;

  var slug = script.getAttribute('data-shop');
  if (!slug) return;

  // Derive base URL from the script src so it works on any domain
  var src = script.getAttribute('src') || '';
  var baseUrl = src.replace(/\/embed\.js.*$/, '').replace(/\/$/, '');
  if (!baseUrl) baseUrl = 'https://aibotbanao.com';

  var chatUrl = baseUrl + '/chat/' + slug;
  var logoUrl = baseUrl + '/newlogo.png';
  var isOpen = false;
  var iframeLoaded = false;

  // Inject styles
  var style = document.createElement('style');
  style.textContent =
    '#_abb-btn{' +
      'position:fixed;bottom:24px;right:24px;' +
      'width:60px;height:60px;border-radius:50%;' +
      'background:transparent;border:none;cursor:pointer;' +
      'box-shadow:0 4px 24px rgba(0,0,0,.22);' +
      'display:flex;align-items:center;justify-content:center;' +
      'z-index:2147483646;transition:transform .2s,box-shadow .2s;' +
      'padding:0;overflow:hidden;' +
    '}' +
    '#_abb-btn:hover{transform:scale(1.08);box-shadow:0 8px 28px rgba(0,0,0,.24);}' +
    '#_abb-btn img._abb-logo{width:60px;height:60px;object-fit:cover;border-radius:50%;display:block;}' +
    '#_abb-btn svg._abb-close{' +
      'width:24px;height:24px;fill:#374151;display:block;' +
    '}' +
    '#_abb-box{' +
      'position:fixed;bottom:96px;right:24px;' +
      'width:380px;height:580px;' +
      'max-width:calc(100vw - 40px);' +
      'max-height:calc(100vh - 120px);' +
      'border-radius:20px;overflow:hidden;' +
      'box-shadow:0 12px 48px rgba(0,0,0,.2);' +
      'border:1px solid rgba(0,0,0,.07);' +
      'z-index:2147483645;' +
      'display:none;background:#f9fafb;' +
      'transition:opacity .18s,transform .18s;' +
      'opacity:0;transform:scale(.96) translateY(10px);' +
    '}' +
    '#_abb-box.open{display:flex;flex-direction:column;}' +
    '#_abb-box.visible{opacity:1;transform:scale(1) translateY(0);}' +
    '#_abb-box iframe{width:100%;flex:1;border:none;display:block;}' +
    '#_abb-err{' +
      'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'padding:24px;text-align:center;font-family:system-ui,sans-serif;' +
    '}' +
    '#_abb-err img{width:48px;height:48px;margin-bottom:12px;border-radius:8px;}' +
    '#_abb-err p{font-size:14px;color:#374151;font-weight:600;margin:0 0 6px;}' +
    '#_abb-err small{font-size:12px;color:#6b7280;line-height:1.5;}';
  document.head.appendChild(style);

  var CLOSE_ICON =
    '<svg class="_abb-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>' +
    '</svg>';

  function logoImg(extraClass) {
    return '<img class="_abb-logo' + (extraClass ? ' ' + extraClass : '') + '" src="' + logoUrl + '" alt="Chat" />';
  }

  var btn = document.createElement('button');
  btn.id = '_abb-btn';
  btn.setAttribute('aria-label', 'Chat kholein');
  btn.innerHTML = logoImg();

  var box = document.createElement('div');
  box.id = '_abb-box';

  document.body.appendChild(box);
  document.body.appendChild(btn);

  function showError() {
    var err = document.createElement('div');
    err.id = '_abb-err';
    err.innerHTML =
      '<img src="' + logoUrl + '" alt="AIBotBanao" />' +
      '<p>Chat connect nahi ho saka</p>' +
      '<small>Development mein, embed sirf us network par kaam karta hai<br>jahan server chal raha ho.<br><br>' +
      'Production URL set karein: <strong>' + baseUrl + '</strong></small>';
    box.appendChild(err);
  }

  btn.addEventListener('click', function () {
    isOpen = !isOpen;

    if (isOpen) {
      box.classList.add('open');
      requestAnimationFrame(function () { box.classList.add('visible'); });

      if (!iframeLoaded) {
        var iframe = document.createElement('iframe');
        iframe.setAttribute('allow', 'microphone');
        iframe.setAttribute('title', 'AIBotBanao Chat');

        // Detect connection failure
        iframe.addEventListener('error', showError);

        // Timeout fallback — if nothing loads in 8s, show error
        var timeout = setTimeout(function () {
          if (box.querySelector('iframe') && !box.querySelector('#_abb-err')) {
            showError();
          }
        }, 8000);

        iframe.addEventListener('load', function () {
          clearTimeout(timeout);
          // If the frame couldn't reach the server, contentDocument is about:blank or error page
          try {
            var loc = iframe.contentWindow && iframe.contentWindow.location.href;
            if (loc && loc.indexOf('about:') === 0) {
              clearTimeout(timeout);
              showError();
            }
          } catch (e) {
            // Cross-origin — that's fine, page loaded from real server
            clearTimeout(timeout);
          }
        });

        iframe.src = chatUrl;
        box.appendChild(iframe);
        iframeLoaded = true;
      }

      btn.innerHTML = CLOSE_ICON;
      btn.setAttribute('aria-label', 'Chat band karein');
    } else {
      box.classList.remove('visible');
      box.addEventListener('transitionend', function handler() {
        box.classList.remove('open');
        box.removeEventListener('transitionend', handler);
      });
      btn.innerHTML = logoImg();
      btn.setAttribute('aria-label', 'Chat kholein');
    }
  });
})();
