/* SkillsUniversity.org — shared behaviour */
(function () {
  'use strict';

  /* ---------- Mobile nav ---------- */
  window.suToggleMenu = function () {
    var m = document.getElementById('suMobile');
    var b = document.getElementById('suBurger');
    if (!m) return;
    var open = m.classList.toggle('open');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  /* ---------- Desktop "Courses" dropdown ---------- */
  document.querySelectorAll('.su-drop > button').forEach(function (btn) {
    var drop = btn.parentElement;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = drop.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.su-drop.open').forEach(function (d) {
      d.classList.remove('open');
      var b = d.querySelector('button');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Scroll reveal ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (e.isIntersecting) {
          setTimeout(function () { e.target.classList.add('visible'); }, i * 55);
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { ro.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- FAQ accordion ---------- */
  window.suToggleFaq = function (btn) {
    var item = btn.closest('.faq-item');
    var wasOpen = item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item').forEach(function (i) {
      i.classList.remove('open');
      var q = i.querySelector('.faq-q');
      if (q) q.setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  };

  /* ---------- Modals ---------- */
  window.suOpenModal = function (id) {
    var o = document.getElementById(id);
    if (!o) return;
    o.classList.add('active');
    document.body.classList.add('modal-open');
    var f = o.querySelector('iframe[data-src]');
    if (f && !f.src) f.src = f.getAttribute('data-src');
    var c = o.querySelector('.modal-close');
    if (c) c.focus();
  };
  window.suCloseModal = function (id) {
    var o = document.getElementById(id);
    if (!o) return;
    o.classList.remove('active');
    document.body.classList.remove('modal-open');
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(function (o) { o.classList.remove('active'); });
      document.body.classList.remove('modal-open');
    }
  });

  /* ---------- Sticky CTA bar ---------- */
  var bar = document.getElementById('stickyBar');
  if (bar && 'IntersectionObserver' in window) {
    document.body.classList.add('has-sticky');
    var heroGone = false, endVisible = false;
    var hero = document.querySelector('[data-sticky-after]');
    var stop = document.querySelector('[data-sticky-stop]');
    function upd() {
      if (heroGone && !endVisible) bar.classList.add('visible');
      else bar.classList.remove('visible');
    }
    if (hero) new IntersectionObserver(function (en) { heroGone = !en[0].isIntersecting; upd(); }, { threshold: 0 }).observe(hero);
    if (stop) new IntersectionObserver(function (en) { endVisible = en[0].isIntersecting; upd(); }, { threshold: 0.1 }).observe(stop);
  }

  /* ---------- Countdown (per-session, resets each visit) ---------- */
  var cdH = document.getElementById('cd-h');
  if (cdH) {
    var KEY = 'su_offer_end_' + (document.body.getAttribute('data-page') || 'x');
    var end = parseInt(sessionStorage.getItem(KEY) || '0', 10);
    if (!end || end < Date.now()) {
      end = Date.now() + 47 * 3600000 + 59 * 60000 + 59000;
      sessionStorage.setItem(KEY, end);
    }
    var cdM = document.getElementById('cd-m'), cdS = document.getElementById('cd-s');
    var pad = function (n) { return ('0' + n).slice(-2); };
    (function tick() {
      var d = Math.max(0, end - Date.now());
      cdH.textContent = pad(Math.floor(d / 3600000));
      if (cdM) cdM.textContent = pad(Math.floor((d % 3600000) / 60000));
      if (cdS) cdS.textContent = pad(Math.floor((d % 60000) / 1000));
      if (d > 0) setTimeout(tick, 1000);
    })();
  }

  /* ---------- Geo pricing ----------
     Page sets window.SU_PRICING = { IN:{...}, GB:{...}, EU:{...}, US:{...} }
     Each entry: { s: symbol, p: price, o: original, sv: saving, url: checkout }
     Markup hooks: [data-price="full"|"old"|"cur"|"num"|"save"], a[data-checkout]
  ------------------------------------ */
  var EU = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','NO','CH','IS','LI','AL','BA','ME','MK','MD','RS','UA','AD','MC','SM','VA','BY','GE','AM','AZ','RU'];

  function pickRegion(cc) {
    var P = window.SU_PRICING;
    if (!P) return null;
    if (!cc) return P.US;
    cc = cc.toUpperCase();
    if (cc === 'IN') return P.IN;
    if (cc === 'GB') return P.GB;
    if (EU.indexOf(cc) >= 0) return P.EU;
    return P.US;
  }

  function applyPrice(p) {
    if (!p) return;
    var set = function (sel, val) {
      document.querySelectorAll(sel).forEach(function (el) { el.textContent = val; });
    };
    set('[data-price="full"]', p.s + p.p);
    set('[data-price="old"]', p.s + p.o);
    set('[data-price="cur"]', p.s);
    set('[data-price="num"]', p.p);
    set('[data-price="save"]', 'You save ' + p.s + p.sv + ' today');
    document.querySelectorAll('a[data-checkout]').forEach(function (a) { a.href = p.url; });
  }

  if (window.SU_PRICING) {
    var guess = '';
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') guess = 'IN';
      else if (tz === 'Europe/London') guess = 'GB';
      else if (tz.indexOf('Europe/') === 0) guess = 'DE';
    } catch (e) {}
    applyPrice(pickRegion(guess));

    fetch('https://ipapi.co/json/')
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.country_code) applyPrice(pickRegion(d.country_code)); })
      .catch(function () {});
  }

  /* ---------- Smooth anchor scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var el = document.querySelector(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
    });
  });
})();

/* ============================================================
   Exit-intent email opt-in ("Enter your email and get 20% off")
   Self-injecting: any page that loads su.js gets this popup.
   - Desktop: fires when the cursor leaves the top of the window
     (classic exit intent — the closest thing to "pressing the X").
   - Mobile: browsers CANNOT detect a tab-close tap, so we fire on
     the Back gesture (exit intent) and, as a fallback, once the
     visitor has scrolled ~60% or spent ~30s on the page.
   - Shows at most once per visitor every 7 days (localStorage).
   - Add  data-no-optin  to <body> on any page to suppress it.
   ============================================================ */
(function () {
  'use strict';
  if (document.body.hasAttribute('data-no-optin')) return;

  var CONFIG = {
    storageKey: 'su_optin_v1',
    suppressDays: 7,
    promoCode: 'WELCOME20',           // TODO: create this 20%-off coupon in Teachable
    fallbackDelayMs: 30000,           // mobile fallback: show after 30s...
    fallbackScrollPct: 0.6            // ...or after scrolling 60%, whichever comes first
  };

  /* --- Where captured emails should go ---------------------------------
     By default the email is only stored in the browser. To actually
     COLLECT addresses, set window.SU_OPTIN_SUBMIT on the page to a function
     that returns a Promise, e.g. POST to Mailchimp / ConvertKit / Formspree
     / a Teachable form. Example:
       window.SU_OPTIN_SUBMIT = function (email) {
         return fetch('https://YOUR-ENDPOINT', {
           method:'POST', headers:{'Content-Type':'application/json'},
           body: JSON.stringify({ email: email })
         });
       };
  --------------------------------------------------------------------- */

  function seen() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (o && o.sub) return true;                       // already subscribed → never nag again
      if (o && o.ts && (Date.now() - o.ts) < CONFIG.suppressDays * 864e5) return true;
      return false;
    } catch (e) { return false; }
  }
  function mark(sub) {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify({ ts: Date.now(), sub: !!sub })); } catch (e) {}
  }
  if (seen()) return;

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
        '<span class="su-optin-badge">Wait — before you go</span>' +
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
    document.body.classList.add('modal-open');
    mark(false);
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 120);
    if (typeof gtag === 'function') { try { gtag('event', 'optin_shown'); } catch (e) {} }
  }
  function close() {
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
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
      : Promise.resolve();

    Promise.resolve(submit).then(function () {
      mark(true);
      if (typeof gtag === 'function') { try { gtag('event', 'generate_lead', { method: 'exit_optin' }); } catch (e) {} }
      offerView.style.display = 'none';
      successView.style.display = 'block';
    }).catch(function () {
      // Even if the provider call fails, don't block the visitor from their code.
      mark(true);
      offerView.style.display = 'none';
      successView.style.display = 'block';
    });
  });

  /* ---- Triggers ---- */
  var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  function arm() {
    if (armed) return;
    armed = true;

    // Desktop exit intent: cursor leaves through the top of the viewport.
    document.addEventListener('mouseout', function (e) {
      if (shown) return;
      if (!e.relatedTarget && e.clientY <= 0) open();
    });

    // Mobile "trying to leave": the Back gesture.
    try {
      history.pushState({ suOptin: 1 }, '');
      window.addEventListener('popstate', function () { if (!shown) open(); });
    } catch (e) {}

    if (coarse) {
      // Mobile fallback so the offer is actually seen (tab-close can't be detected).
      setTimeout(function () { open(); }, CONFIG.fallbackDelayMs);
      window.addEventListener('scroll', function onScroll() {
        var h = document.documentElement;
        var pct = (h.scrollTop) / ((h.scrollHeight - h.clientHeight) || 1);
        if (pct >= CONFIG.fallbackScrollPct) { window.removeEventListener('scroll', onScroll); open(); }
      }, { passive: true });
    }
  }

  // Don't arm instantly — give the visitor a few seconds first.
  setTimeout(arm, 4000);
})();
