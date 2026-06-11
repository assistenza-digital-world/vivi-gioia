/* =====================================================================
   ViviGioia — App JS
   Progressive enhancement: il sito funziona senza JS.
   Lenis (smooth scroll) + GSAP/ScrollTrigger (hero, parallax) +
   IntersectionObserver (reveal, count-up) + Swiper (gallerie).
   ===================================================================== */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = (navigator.connection && navigator.connection.saveData) === true;
  var isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  var skipAnim = window.location.search.indexOf('skip-animations') !== -1;

  /* ---------------- NAV ---------------- */
  function initNav() {
    var body = document.body;
    var toggle = document.querySelector('.nav__toggle');
    var nav = document.querySelector('.nav');
    var main = document.getElementById('main');
    if (!toggle || !nav) return;

    function setOpen(open) {
      body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
      document.documentElement.style.overflow = open ? 'hidden' : '';
      // confina screen reader/tastiera al pannello mentre è aperto
      if (main) { if (open) main.setAttribute('inert', ''); else main.removeAttribute('inert'); }
      if (open) {
        var first = nav.querySelector('a, button');
        if (first) first.focus();
      } else {
        toggle.focus();
      }
    }
    toggle.addEventListener('click', function () {
      setOpen(!body.classList.contains('nav-open'));
    });
    // chiudi su click link (mobile)
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { if (!isDesktop) setOpen(false); });
    });
    // sottomenu: accordion (mobile) / toggle accessibile (desktop)
    nav.querySelectorAll('.nav__parent').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.closest('.nav__group');
        var open = group.getAttribute('data-open') === 'true';
        // su desktop chiudi gli altri gruppi aperti
        if (isDesktop) {
          nav.querySelectorAll('.nav__group[data-open="true"]').forEach(function (g) {
            if (g !== group) { g.setAttribute('data-open', 'false'); var b = g.querySelector('.nav__parent'); if (b) b.setAttribute('aria-expanded', 'false'); }
          });
        }
        group.setAttribute('data-open', open ? 'false' : 'true');
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
    // chiudi dropdown desktop cliccando fuori
    document.addEventListener('click', function (e) {
      if (!isDesktop) return;
      if (!nav.contains(e.target)) {
        nav.querySelectorAll('.nav__group[data-open="true"]').forEach(function (g) {
          g.setAttribute('data-open', 'false');
          var b = g.querySelector('.nav__parent'); if (b) b.setAttribute('aria-expanded', 'false');
        });
      }
    });
    // focus trap nel pannello mobile aperto
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || isDesktop || !body.classList.contains('nav-open')) return;
      var f = nav.querySelectorAll('a[href], button:not([disabled])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) setOpen(false);
    });
  }

  /* ---------------- HEADER scroll state ---------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var hero = document.querySelector('[data-hero-sentinel]');
    function onScroll() {
      header.setAttribute('data-scrolled', window.scrollY > 24 ? 'true' : 'false');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // tema chiaro finché l'hero scuro è in vista (solo se header parte trasparente)
    if (hero && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          header.setAttribute('data-theme', en.isIntersecting ? 'light' : 'dark');
        });
      }, { rootMargin: '-' + (header.offsetHeight + 10) + 'px 0px 0px 0px', threshold: 0 });
      io.observe(hero);
    }
  }

  /* ---------------- REVEAL (IntersectionObserver) ---------------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!els.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.setAttribute('data-reveal', 'in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        if (el.classList.contains('reveal-stagger')) {
          var kids = el.children, i = 0;
          [].forEach.call(kids, function (k) {
            k.style.transitionDelay = (i * 90) + 'ms';
            i++;
          });
        }
        el.setAttribute('data-reveal', 'in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- COUNT-UP ---------------- */
  function initCountup() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      nums.forEach(function (n) { n.textContent = n.getAttribute('data-count') + (n.getAttribute('data-suffix') || ''); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var prefix = el.getAttribute('data-prefix') || '';
        var dur = 1400, start = null;
        var group = el.getAttribute('data-group') !== 'false';
        var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
        function fmt(v) { return group ? Number(v).toLocaleString('it-IT') : String(v); }
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = (target * eased).toFixed(decimals);
          el.textContent = prefix + fmt(val) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = prefix + fmt(target) + suffix;
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------------- GSAP: hero timeline + parallax ---------------- */
  function initGsap() {
    if (typeof window.gsap === 'undefined') return;
    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // Hero timeline (solo se non reduced-motion)
    var hero = document.querySelector('[data-hero]');
    if (hero && !prefersReduced) {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      var claim = hero.querySelector('.hero__claim');
      var sub = hero.querySelector('.hero__sub');
      var actions = hero.querySelector('.hero__actions');
      if (claim) tl.from(claim, { opacity: 0, y: 60, duration: 1.1 }, 0.15);
      if (sub) tl.from(sub, { opacity: 0, y: 36, duration: 0.9 }, '-=0.7');
      if (actions) tl.from(actions, { opacity: 0, y: 24, duration: 0.7 }, '-=0.55');
    }

    if (!window.ScrollTrigger) return;
    var ScrollTrigger = window.ScrollTrigger;
    var mm = gsap.matchMedia();

    // Parallax solo desktop (no reduced-motion, no save-data)
    if (!prefersReduced && !saveData) {
      mm.add('(min-width: 1024px)', function () {
        document.querySelectorAll('[data-parallax]').forEach(function (el) {
          var amount = parseFloat(el.getAttribute('data-parallax')) || -12;
          gsap.to(el, {
            yPercent: amount, ease: 'none',
            scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
      });
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); }, 250);
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ---------------- LENIS smooth scroll ---------------- */
  function initLenis() {
    if (prefersReduced || typeof window.Lenis === 'undefined') return;
    var lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
    }
    // anchor interni
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1) {
          var t = document.querySelector(id);
          if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -90 }); }
        }
      });
    });
    window.__lenis = lenis;
  }

  /* ---------------- SWIPER gallerie ---------------- */
  function initSwiper() {
    if (typeof window.Swiper === 'undefined') return;
    document.querySelectorAll('[data-swiper]').forEach(function (el) {
      var scope = el.closest('section') || el.parentElement;
      var prev = scope.querySelector('[data-swiper-prev]');
      var next = scope.querySelector('[data-swiper-next]');
      new window.Swiper(el, {
        slidesPerView: 'auto',
        spaceBetween: 18,
        grabCursor: true,
        speed: 520,
        navigation: (prev && next) ? { prevEl: prev, nextEl: next } : false,
        keyboard: { enabled: true },
        a11y: { enabled: true },
        breakpoints: { 1024: { spaceBetween: 26 } }
      });
    });
  }

  /* ---------------- HERO video (data-saver aware) ---------------- */
  function initHeroVideo() {
    var v = document.querySelector('[data-hero-video]');
    if (!v) return;
    var soundBtn = document.querySelector('[data-sound-toggle]');
    if (prefersReduced || saveData) {
      // mostra poster, non avviare il video
      v.removeAttribute('autoplay');
      try { v.pause(); } catch (e) {}
      if (soundBtn) soundBtn.style.display = 'none';
      return;
    }
    // assicura autoplay mobile
    v.muted = true; v.setAttribute('muted', '');
    var p = v.play();
    if (p && p.catch) p.catch(function () {});

    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        v.muted = !v.muted;
        soundBtn.setAttribute('aria-pressed', v.muted ? 'false' : 'true');
        soundBtn.querySelector('[data-sound-on]').hidden = v.muted;
        soundBtn.querySelector('[data-sound-off]').hidden = !v.muted;
        if (!v.muted) { v.play().catch(function () {}); }
      });
    }
  }

  /* ---------------- LQIP blur-up ---------------- */
  function initLazyBlur() {
    document.querySelectorAll('img[data-lqip]').forEach(function (img) {
      function clear() { img.removeAttribute('data-lqip'); img.style.background = 'none'; }
      if (img.complete && img.naturalWidth > 0) clear();
      else img.addEventListener('load', clear, { once: true });
    });
  }

  /* ---------------- Anno corrente ---------------- */
  function initYear() {
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- QA hook ---------------- */
  window.completeAllAnimations = function () {
    if (window.gsap) window.gsap.globalTimeline.progress(1);
    if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(function (st) { st.scroll(st.end); });
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) { el.setAttribute('data-reveal', 'in'); });
    document.querySelectorAll('[data-count]').forEach(function (n) {
      var grp = n.getAttribute('data-group') !== 'false';
      var c = n.getAttribute('data-count');
      n.textContent = (n.getAttribute('data-prefix') || '') + (grp ? Number(c).toLocaleString('it-IT') : c) + (n.getAttribute('data-suffix') || '');
    });
  };

  /* ---------------- Boot ---------------- */
  function boot() {
    initNav();
    initHeader();
    initReveal();
    initCountup();
    initLazyBlur();
    initHeroVideo();
    initYear();
    initSwiper();
    if (!skipAnim) { initGsap(); initLenis(); }
    else { window.completeAllAnimations(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
