/* ============================================================
   SkillsUniversity — Exit-intent email opt-in ("Get 20% off")
   SELF-CONTAINED: injects its own CSS + markup, so it works on
   ANY page (course pages, blog articles, etc.) without needing
   the shared su.css design system.

   - Desktop: fires when the cursor leaves the top of the window
     (classic exit intent — the closest thing to "pressing the X").
   - Mobile: browsers CANNOT detect a tab-close tap, so we fire on
     the Back gesture and, as a fallback, once the visitor has
     scrolled ~60% or spent ~30s on the page.
   - Shows at most once per visitor every 7 days (localStorage).
   - Add  data-no-optin  to <body> on any page to suppress it.
   - Emails each lead to CONFIG.notifyEmail via FormSubmit (no acct).
   - Fires GA4 "generate_lead" + Meta Pixel "Lead" on submit.
   ============================================================ */
(function () {
  'use strict';
  if (window.__suOptinInit) return;          // never run twice on one page
  window.__suOptinInit = true;
  if (document.body.hasAttribute('data-no-optin')) return;

  var CONFIG = {
    storageKey: 'su_optin_v1',
    suppressDays: 7,
    promoCode: 'WELCOME20',           // TODO: create this 20%-off coupon in Teachable
    notifyEmail: 'contact@skillsuniversity.org', // leads emailed here (via FormSubmit)
    fallbackDelayMs: 30000,           // mobile fallback: show after 30s...
    fallbackScrollPct: 0.6            // ...or after scrolling 60%, whichever comes first
  };

  /* --- Where captured emails go ----------------------------------------
     DEFAULT: each submission is emailed to CONFIG.notifyEmail using
     FormSubmit (https://formsubmit.co) — a free relay that needs no
     account. The first live submission triggers a one-time "Activate
     your form" email to that address; click it once and every later
     lead arrives automatically. (Nothing sends from localhost.)
     To use a real email tool instead, set window.SU_OPTIN_SUBMIT on the
     page to a function returning a Promise; it overrides the default. */
  function defaultSubmit(email) {
    if (!CONFIG.notifyEmail) return Promise.resolve();
    return fetch('https://formsubmit.co/ajax/' + encodeURIComponent(CONFIG.notifyEmail), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: 'New 20% pop-up lead: ' + email,
        email: email,
        code_to_send: CONFIG.promoCode,
        source: 'Exit-intent pop-up',
        page: (location && location.href) || ''
      })
    });
  }

  /* ---- Inject styles once (hardcoded brand colours) ---- */
  var CSS = [
    '.su-optin-overlay{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(3,8,20,0.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}',
    '.su-optin-overlay *{box-sizing:border-box}',
    '.su-optin-overlay.open{display:flex;animation:suOptinFade .25s ease}',
    '@keyframes suOptinFade{from{opacity:0}to{opacity:1}}',
    '.su-optin{position:relative;width:100%;max-width:440px;background:linear-gradient(160deg,#0d1f45,#08152e);border:1px solid rgba(230,179,51,0.25);border-radius:20px;padding:40px 32px 34px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,0.6);animation:suOptinPop .3s cubic-bezier(.2,.9,.3,1.2)}',
    '@keyframes suOptinPop{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}',
    '.su-optin-close{position:absolute;top:12px;right:14px;background:none;border:none;color:rgba(255,255,255,0.5);font-size:1.6rem;line-height:1;cursor:pointer;width:36px;height:36px;border-radius:8px;transition:color .2s,background .2s}',
    '.su-optin-close:hover{color:#fff;background:rgba(255,255,255,0.08)}',
    ".su-optin-badge{display:inline-block;font-family:'JetBrains Mono','Courier New',Courier,monospace;font-size:0.68rem;letter-spacing:0.16em;text-transform:uppercase;color:#e6b333;border:1px solid rgba(230,179,51,0.25);border-radius:999px;padding:6px 14px;margin-bottom:16px}",
    ".su-optin h3{font-family:'Plus Jakarta Sans','Arial Black','Helvetica Neue',Arial,sans-serif;font-size:1.55rem;line-height:1.2;color:#fff;margin:0 0 10px}",
    '.su-optin h3 span{color:#e6b333}',
    ".su-optin p{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:0.95rem;color:rgba(255,255,255,0.65);line-height:1.6;margin:0 0 22px}",
    '.su-optin-form{display:flex;flex-direction:column;gap:10px;margin:0}',
    ".su-optin-input{width:100%;padding:14px 16px;border-radius:10px;border:1px solid rgba(230,179,51,0.25);background:rgba(5,13,31,0.6);color:#fff;font-size:1rem;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}",
    '.su-optin-input::placeholder{color:rgba(255,255,255,0.5)}',
    '.su-optin-input:focus{outline:none;border-color:#e6b333;box-shadow:0 0 0 3px rgba(230,179,51,0.18)}',
    ".su-optin-btn{width:100%;padding:14px 16px;border:none;border-radius:10px;cursor:pointer;background:linear-gradient(135deg,#c9971f 0%,#9c7016 100%);color:#fff;font-family:'Plus Jakarta Sans','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:1rem;box-shadow:0 4px 20px rgba(201,151,31,0.4),inset 0 1px 0 rgba(255,255,255,0.15);transition:transform .2s,box-shadow .2s}",
    '.su-optin-btn:hover{transform:translateY(-2px);box-shadow:0 6px 28px rgba(201,151,31,0.55),inset 0 1px 0 rgba(255,255,255,0.15)}',
    '.su-optin-btn:disabled{opacity:.7;cursor:default;transform:none}',
    '.su-optin-err{color:#ff9b9b;font-size:0.82rem;min-height:1em;margin-top:2px}',
    '.su-optin-fine{font-family:\'Inter\',sans-serif;font-size:0.72rem;color:rgba(255,255,255,0.5);margin-top:14px}',
    '.su-optin-success h3{margin-bottom:8px}',
    ".su-optin-code{display:inline-block;font-family:'JetBrains Mono','Courier New',Courier,monospace;font-size:1.15rem;letter-spacing:0.1em;color:#e6b333;background:rgba(5,13,31,0.6);border:1px dashed #e6b333;border-radius:10px;padding:12px 22px;margin:6px 0 4px}",
    'body.su-modal-open{overflow:hidden}',
    '@media (max-width:420px){.su-optin{padding:34px 20px 28px;border-radius:16px}.su-optin h3{font-size:1.3rem}}'
  ].join('');

  function seen() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (o && o.sub) return true;
      if (o && o.ts && (Date.now() - o.ts) < CONFIG.suppressDays * 864e5) return true;
      return false;
    } catch (e) { return false; }
  }
  function mark(sub) {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify({ ts: Date.now(), sub: !!sub })); } catch (e) {}
  }
  if (seen()) return;

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var shown = false, armed = false;

  var overlay = document.createElement('div');
  overlay.className = 'su-optin-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Get 20% off');
  overlay.innerHTML =
    '<div class="su-optin">' +
      '<button class="su-optin-close" type="button" aria-label="Close">&times;</button>' +
      '<div class="su-optin-view su-optin-offer">' +
        '<span class="su-optin-badge">Wait \u2014 before you go</span>' +
        '<h3>Get <span>20% off</span> your first course</h3>' +
        '<p>Enter your email and we\u2019ll send you a 20% discount code you can use on any SkillsUniversity course.</p>' +
        '<form class="su-optin-form" novalidate>' +
          '<input class="su-optin-input" type="email" inputmode="email" autocomplete="email" placeholder="you@email.com" aria-label="Email address" required>' +
          '<div class="su-optin-err" aria-live="polite"></div>' +
          '<button class="su-optin-btn" type="submit">Send my 20% code</button>' +
        '</form>' +
        '<div class="su-optin-fine">No spam. Unsubscribe anytime.</div>' +
      '</div>' +
      '<div class="su-optin-view su-optin-success" style="display:none">' +
        '<span class="su-optin-badge">You\u2019re in \u2713</span>' +
        '<h3>Here\u2019s your <span>20% off</span> code</h3>' +
        '<div class="su-optin-code">' + CONFIG.promoCode + '</div>' +
        '<p>Apply it at checkout. We\u2019ve also emailed it to you \u2014 check your inbox.</p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var offerView = overlay.querySelector('.su-optin-offer');
  var successView = overlay.querySelector('.su-optin-success');
  var form = overlay.querySelector('.su-optin-form');
  var input = overlay.querySelector('.su-optin-input');
  var err = overlay.querySelector('.su-optin-err');

  function open() {
    if (shown) return;
    shown = true;
    overlay.classList.add('open');
    document.body.classList.add('su-modal-open');
    mark(false);
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 120);
    if (typeof gtag === 'function') { try { gtag('event', 'optin_shown'); } catch (e) {} }
  }
  function close() {
    overlay.classList.remove('open');
    document.body.classList.remove('su-modal-open');
  }

  overlay.querySelector('.su-optin-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = (input.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.textContent = 'Please enter a valid email address.';
      input.focus();
      return;
    }
    err.textContent = '';
    var btn = form.querySelector('.su-optin-btn');
    btn.disabled = true; btn.textContent = 'Sending\u2026';

    var submit = (typeof window.SU_OPTIN_SUBMIT === 'function')
      ? window.SU_OPTIN_SUBMIT(email)
      : defaultSubmit(email);

    function fireLead() {
      if (typeof gtag === 'function') { try { gtag('event', 'generate_lead', { method: 'exit_optin' }); } catch (e) {} }
      if (typeof fbq === 'function') { try { fbq('track', 'Lead', { content_name: 'Exit-intent 20% offer', currency: 'USD', value: 0 }); } catch (e) {} }
    }

    Promise.resolve(submit).then(function () {
      mark(true); fireLead();
      offerView.style.display = 'none';
      successView.style.display = 'block';
    }).catch(function () {
      mark(true); fireLead();
      offerView.style.display = 'none';
      successView.style.display = 'block';
    });
  });

  /* ---- Triggers ---- */
  var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  function arm() {
    if (armed) return;
    armed = true;

    document.addEventListener('mouseout', function (e) {
      if (shown) return;
      if (!e.relatedTarget && e.clientY <= 0) open();
    });

    try {
      history.pushState({ suOptin: 1 }, '');
      window.addEventListener('popstate', function () { if (!shown) open(); });
    } catch (e) {}

    if (coarse) {
      setTimeout(function () { open(); }, CONFIG.fallbackDelayMs);
      window.addEventListener('scroll', function onScroll() {
        var h = document.documentElement;
        var pct = (h.scrollTop) / ((h.scrollHeight - h.clientHeight) || 1);
        if (pct >= CONFIG.fallbackScrollPct) { window.removeEventListener('scroll', onScroll); open(); }
      }, { passive: true });
    }
  }

  setTimeout(arm, 4000);
})();
