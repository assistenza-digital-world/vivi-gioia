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

    // Parallax + galleria orizzontale: solo desktop (no reduced-motion, no save-data)
    if (!prefersReduced && !saveData) {
      mm.add('(min-width: 1024px)', function () {
        document.querySelectorAll('[data-parallax]').forEach(function (el) {
          var amount = parseFloat(el.getAttribute('data-parallax')) || -12;
          gsap.to(el, {
            yPercent: amount, ease: 'none',
            scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
        // galleria a scorrimento orizzontale guidato dallo scroll verticale
        document.querySelectorAll('[data-hscroll]').forEach(function (sec) {
          var track = sec.querySelector('[data-htrack]');
          if (!track) return;
          sec.classList.add('is-pinned');
          var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 60); };
          gsap.to(track, {
            x: function () { return -dist(); },
            ease: 'none',
            scrollTrigger: {
              trigger: sec, start: 'top top',
              end: function () { return '+=' + dist(); },
              scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true
            }
          });
        });
        return function () { document.querySelectorAll('[data-hscroll]').forEach(function (s) { s.classList.remove('is-pinned'); }); };
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

  /* ---------------- GALLERIA (frecce su touch/fallback) ---------------- */
  function initGallery() {
    document.querySelectorAll('[data-gallery]').forEach(function (vp) {
      var sec = vp.closest('section');
      if (!sec) return;
      var prev = sec.querySelector('[data-gallery-prev]');
      var next = sec.querySelector('[data-gallery-next]');
      function step(dir) {
        var slide = vp.querySelector('.gallery__slide');
        var w = slide ? slide.getBoundingClientRect().width + 18 : 340;
        vp.scrollBy({ left: dir * w, behavior: prefersReduced ? 'auto' : 'smooth' });
      }
      if (prev) prev.addEventListener('click', function () { step(-1); });
      if (next) next.addEventListener('click', function () { step(1); });
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

  /* ---------------- Intro terremoto (la pagina si spacca) ---------------- */
  function initQuake() {
    var q = document.querySelector('[data-quake]');
    if (!q) return;
    var done = false;
    function finish() { if (done) return; done = true; q.classList.add('is-done'); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }
    if (prefersReduced || saveData || typeof window.gsap === 'undefined') { finish(); return; }
    var gsap = window.gsap;
    setTimeout(finish, 5000); // rete di sicurezza: non bloccare mai la pagina
    var l = q.querySelector('.quake__half--l'), r = q.querySelector('.quake__half--r');
    var crack = q.querySelector('.quake__crack'), label = q.querySelector('.quake__label');
    var tl = gsap.timeline({ onComplete: finish });
    tl.to(label, { opacity: 1, duration: 0.5 }, 0.2)
      .to(q, { keyframes: [{ x: -7 }, { x: 7 }, { x: -9 }, { x: 10 }, { x: -6 }, { x: 8 }, { x: -11 }, { x: 11 }, { x: 0 }], duration: 1.5, ease: 'none' }, 0.3)
      .to(crack, { scaleY: 1, duration: 0.5, ease: 'power2.in' }, 1.0)
      .to(label, { opacity: 0, duration: 0.3 }, 1.6)
      .to(l, { xPercent: -102, duration: 1.0, ease: 'power4.inOut' }, 1.8)
      .to(r, { xPercent: 102, duration: 1.0, ease: 'power4.inOut' }, 1.8);
  }

  /* ---------------- Cursore custom (bussola) ---------------- */
  function initCursor() {
    if (prefersReduced) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    var cur = document.querySelector('[data-cursor]');
    if (!cur) return;
    document.body.classList.add('has-cursor');
    var needle = cur.querySelector('.cursor__needle');
    var x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y, ang = 0;
    document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    document.addEventListener('mousedown', function () { cur.classList.add('is-down'); });
    document.addEventListener('mouseup', function () { cur.classList.remove('is-down'); });
    var sel = 'a, button, input, textarea, select, .wp__link, [data-cursor-hover]';
    document.addEventListener('mouseover', function (e) { if (e.target.closest && e.target.closest(sel)) cur.classList.add('is-hover'); });
    document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest(sel)) cur.classList.remove('is-hover'); });
    document.documentElement.addEventListener('mouseleave', function () { cur.style.opacity = '0'; });
    document.documentElement.addEventListener('mouseenter', function () { cur.style.opacity = ''; });
    function raf() {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      var dx = tx - x, dy = ty - y;
      if (Math.abs(dx) + Math.abs(dy) > 0.6) {
        var a = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        ang += ((a - ang + 540) % 360 - 180) * 0.2;
      }
      cur.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (needle) needle.style.transform = 'rotate(' + ang + 'deg)';
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ---------------- Indice-sentiero laterale curvo ---------------- */
  function initTrail() {
    var trail = document.querySelector('[data-trail]');
    if (!trail || prefersReduced) return;
    if (window.innerWidth < 1366) return;
    var svg = trail.querySelector('.trail-nav__svg');
    var path = trail.querySelector('[data-trail-path]');
    var hiker = trail.querySelector('[data-trail-hiker]');
    var detour = trail.querySelector('[data-trail-detour]');
    var pawsBox = trail.querySelector('[data-trail-paws]');
    if (!path || !svg) return;
    var L = path.getTotalLength();
    path.style.strokeDasharray = L; path.style.strokeDashoffset = L;

    function vb() { return { w: svg.clientWidth, h: svg.clientHeight }; }
    function pointAt(frac) {
      var p = path.getPointAtLength(Math.max(0, Math.min(1, frac)) * L);
      var d = vb();
      return { x: p.x / 100 * d.w, y: p.y / 1000 * d.h };
    }
    function docMax() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }

    var points = [].slice.call(trail.querySelectorAll('.wp')).map(function (wp) {
      return { wp: wp, el: document.getElementById(wp.getAttribute('data-target')), dot: wp.querySelector('.wp__dot'), conn: wp.querySelector('.wp__connector'), frac: 0 };
    });

    // orme decorative lungo il percorso
    var paws = [];
    if (pawsBox) {
      pawsBox.innerHTML = ''; var N = 15;
      for (var i = 1; i < N; i++) {
        var f = i / N, pt = pointAt(f), d0 = vb();
        var p2 = path.getPointAtLength(Math.min(1, f + 0.004) * L);
        var ang = Math.atan2((p2.y / 1000 * d0.h) - pt.y, (p2.x / 100 * d0.w) - pt.x) * 180 / Math.PI + 90;
        var paw = document.createElement('span');
        paw.className = 'trail-paw';
        paw.style.left = pt.x + 'px'; paw.style.top = pt.y + 'px'; paw.style.setProperty('--r', ang.toFixed(1) + 'deg');
        paw.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="15.5" rx="5" ry="4.2"/><circle cx="5.5" cy="10.5" r="2"/><circle cx="18.5" cy="10.5" r="2"/><circle cx="9" cy="6.5" r="1.8"/><circle cx="15" cy="6.5" r="1.8"/></svg>';
        pawsBox.appendChild(paw); paws.push({ el: paw, f: f });
      }
    }

    var nWp = points.length;
    function place() {
      var d = vb();
      points.forEach(function (p, i) {
        p.frac = nWp > 1 ? i / (nWp - 1) : 0;
        var pt = pointAt(p.frac);
        p.wp.style.top = pt.y + 'px';
        if (p.dot) p.dot.style.left = pt.x + 'px';
        if (p.conn) { p.conn.style.left = pt.x + 'px'; p.conn.style.width = Math.max(0, d.w - pt.x - 14) + 'px'; }
      });
      paws.forEach(function (pw) { var pt = pointAt(pw.f); pw.el.style.left = pt.x + 'px'; pw.el.style.top = pt.y + 'px'; });
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(place, 200); });
    window.addEventListener('load', function () { place(); update(); });
    place();

    var idleTimer, idleShown = false;
    function update() {
      var prog = Math.min(window.scrollY / docMax(), 1);
      path.style.strokeDashoffset = L * (1 - prog);
      var hp = pointAt(prog);
      if (hiker) { hiker.style.left = hp.x + 'px'; hiker.style.top = hp.y + 'px'; }
      if (detour) detour.style.top = hp.y + 'px';
      paws.forEach(function (pw) { pw.el.classList.toggle('on', prog >= pw.f); });
      var activeIdx = nWp > 1 ? Math.round(prog * (nWp - 1)) : 0;
      points.forEach(function (p, i) {
        p.wp.classList.toggle('is-reached', prog >= p.frac - 0.01);
        p.wp.classList.toggle('is-active', i === activeIdx);
      });
    }
    function hideDetour() { if (detour) detour.hidden = true; idleShown = false; }
    function showDetour() { if (!detour || window.scrollY / docMax() > 0.9) return; detour.hidden = false; idleShown = true; }
    function onScroll() { update(); if (idleShown) hideDetour(); clearTimeout(idleTimer); idleTimer = setTimeout(showDetour, 7000); }
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    idleTimer = setTimeout(showDetour, 9000);
  }

  /* ---------------- Orso che cammina (pagina natura) ---------------- */
  function initBearWalk() {
    var bw = document.querySelector('[data-bearwalk]');
    if (!bw || prefersReduced) return;
    var bear = bw.querySelector('[data-bearwalk-bear]');
    var pawsBox = bw.querySelector('[data-bearwalk-paws]');
    if (!bear || !pawsBox) return;
    var paws = [];
    function build() {
      pawsBox.innerHTML = ''; paws = [];
      var n = Math.max(8, Math.round(window.innerWidth / 95));
      for (var i = 0; i < n; i++) {
        var f = (i + 0.5) / n;
        var p = document.createElement('span');
        p.className = 'bearwalk__paw';
        p.style.left = (f * 100) + '%';
        p.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="15.5" rx="5" ry="4.2"/><circle cx="5.5" cy="10.5" r="2"/><circle cx="18.5" cy="10.5" r="2"/><circle cx="9" cy="6.5" r="1.8"/><circle cx="15" cy="6.5" r="1.8"/></svg>';
        pawsBox.appendChild(p); paws.push({ el: p, f: f });
      }
    }
    build();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); });
    function docMax() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }
    function update() {
      var prog = Math.min(window.scrollY / docMax(), 1);
      var w = window.innerWidth, bwid = bear.offsetWidth || 80;
      var x = prog * (w - bwid);
      var front = x + bwid * 0.72;
      bear.style.transform = 'translateX(' + x + 'px) translateY(' + (Math.sin(prog * 34) * 4) + 'px)';
      paws.forEach(function (pw) { pw.el.classList.toggle('on', pw.f * w <= front); });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('load', update);
    update();
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
    initQuake();
    initNav();
    initHeader();
    initReveal();
    initCountup();
    initLazyBlur();
    initHeroVideo();
    initYear();
    initGallery();
    initCursor();
    initTrail();
    initBearWalk();
    if (!skipAnim) { initGsap(); initLenis(); }
    else { window.completeAllAnimations(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
