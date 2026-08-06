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
