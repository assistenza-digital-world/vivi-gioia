/* =====================================================================
   ViviGioia — Mappa 3D giocabile di Gioia dei Marsi (Three.js)
   Omino controllabile con frecce/tastiera + menu "Dove vuoi andare?".
   Fallback automatico se WebGL non è disponibile.
   ===================================================================== */
(function () {
  'use strict';
  var root = document.querySelector('[data-map3d]');
  if (!root || typeof window.THREE === 'undefined') return;

  var C = {
    grass: 0x4f7a44, grassDark: 0x3f6638, path: 0xcdb78a, water: 0x6f93b0,
    stone: 0xcdbfa3, stoneDark: 0x9c8f76, roof: 0xb24a2c, wall: 0xefe6d4,
    tree: 0x355e34, trunk: 0x6b4a2e, mountain: 0x5d6f54, skin: 0xe9b98c,
    jacket: 0x007a52, hat: 0xfcdf49, pack: 0xb24a2c, marker: 0xfcdf49
  };

  var POIS = [
    { id: 'piazza', label: 'Piazza della Repubblica', x: 0, z: 2, text: 'Il cuore del paese ricostruito dopo il 1915, attorno al municipio e alla grande piazza.' },
    { id: 'chiesa', label: 'Santa Maria Assunta', x: -9, z: -5, text: 'La chiesa parrocchiale dalla facciata neoclassica, ricostruita e consacrata nel 1923.' },
    { id: 'torre', label: 'Torre di Sperone', x: 13, z: -9, text: 'La torre cilindrica del XIII secolo, sentinella della Marsica: il simbolo di Gioia.' },
    { id: 'vecchio', label: 'Gioia Vecchio', x: -14, z: -12, text: 'Il borgo d’altura a 1.400 m, tra ruderi e silenzio, dove inizia il Parco.' },
    { id: 'parco', label: 'Il Parco e i sentieri', x: -12, z: 11, text: 'Le faggete del Parco Nazionale d’Abruzzo e il regno dell’orso marsicano.' },
    { id: 'fucino', label: 'Belvedere sul Fucino', x: 12, z: 12, text: 'Lo sguardo sulla piana del Fucino, nata dal prosciugamento del lago.' }
  ];

  var THREE = window.THREE;
  var canvas = root.querySelector('[data-map3d-canvas]');
  var menu = root.querySelector('[data-map3d-menu]');
  var info = root.querySelector('[data-map3d-info]');
  var infoTitle = root.querySelector('[data-info-title]');
  var infoText = root.querySelector('[data-info-text]');

  // WebGL check
  try {
    var test = document.createElement('canvas');
    if (!(window.WebGLRenderingContext && (test.getContext('webgl') || test.getContext('experimental-webgl')))) throw 0;
  } catch (e) {
    var fb = root.querySelector('[data-map3d-fallback]'); if (fb) fb.hidden = false;
    root.classList.add('map3d--fallback');
    return;
  }

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xeae3d4, 38, 72);
  var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);

  // Luci
  scene.add(new THREE.HemisphereLight(0xffffff, 0x556b44, 0.95));
  var sun = new THREE.DirectionalLight(0xfff2d6, 0.85);
  sun.position.set(12, 20, 8);
  scene.add(sun);

  function mat(color, flat) { return new THREE.MeshStandardMaterial({ color: color, roughness: flat ? 1 : 0.85, metalness: 0, flatShading: !!flat }); }

  // Terreno
  var ground = new THREE.Mesh(new THREE.CircleGeometry(34, 48), mat(C.grass));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  // chiazze d'erba scura
  for (var i = 0; i < 14; i++) {
    var p = new THREE.Mesh(new THREE.CircleGeometry(2 + Math.abs(Math.sin(i * 5)) * 3, 12), mat(C.grassDark));
    p.rotation.x = -Math.PI / 2; p.position.set(Math.sin(i * 2.3) * 22, 0.01, Math.cos(i * 1.7) * 22);
    scene.add(p);
  }
  // Fucino (piana azzurra)
  var fucino = new THREE.Mesh(new THREE.CircleGeometry(15, 32), mat(C.water));
  fucino.rotation.x = -Math.PI / 2; fucino.position.set(16, 0.02, 18); scene.add(fucino);

  function addTree(x, z, s) {
    var g = new THREE.Group();
    var t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1, 6), mat(C.trunk)); t.position.y = 0.5; g.add(t);
    var c = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 2.2 * s, 7), mat(C.tree, true)); c.position.y = 1.8 * s; g.add(c);
    g.position.set(x, 0, z); scene.add(g); return g;
  }
  function addHouse(x, z, rot) {
    var g = new THREE.Group();
    var b = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 2), mat(C.wall)); b.position.y = 0.8; g.add(b);
    var r = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.1, 4), mat(C.roof, true)); r.position.y = 2.15; r.rotation.y = Math.PI / 4; g.add(r);
    g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g); return g;
  }
  function addMountain(x, z, s) {
    var m = new THREE.Mesh(new THREE.ConeGeometry(6 * s, 9 * s, 6), mat(C.mountain, true));
    m.position.set(x, 4.4 * s, z); scene.add(m); return m;
  }

  // Montagne sullo sfondo
  addMountain(-18, -22, 1.6); addMountain(-6, -26, 2); addMountain(10, -24, 1.7); addMountain(24, -18, 1.4);
  // Alberi sparsi (lato Parco)
  for (var t2 = 0; t2 < 22; t2++) { var ang = t2 * 1.3; addTree(-12 + Math.sin(ang) * 6, 11 + Math.cos(ang) * 6, 0.8 + (t2 % 3) * 0.2); }
  // Case attorno alla piazza
  addHouse(3, 4, 0.3); addHouse(-3, 5, -0.2); addHouse(5, -1, 0.6); addHouse(-5, 1, 0); addHouse(2, -4, 0.2); addHouse(-2, -6, 0.4);

  // Landmark per i POI
  function buildLandmark(poi) {
    var g = new THREE.Group(); g.position.set(poi.x, 0, poi.z);
    if (poi.id === 'torre') {
      var rock = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 1.4, 8), mat(C.stoneDark, true)); rock.position.y = 0.7; g.add(rock);
      var tw = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 5, 12), mat(C.stone)); tw.position.y = 3.9; g.add(tw);
      var top = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, 0.5, 12), mat(C.stoneDark)); top.position.y = 6.5; g.add(top);
    } else if (poi.id === 'chiesa') {
      var body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 4.5), mat(C.wall)); body.position.y = 1.2; g.add(body);
      var roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 2.2, 1.4, 3), mat(C.roof, true)); roof.position.set(0, 3.1, 0); roof.rotation.y = Math.PI / 2; roof.scale.z = 2; g.add(roof);
      var bell = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4, 0.9), mat(C.stone)); bell.position.set(-1.2, 2, 2); g.add(bell);
      var cross = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), mat(0xffffff)); cross.position.set(-1.2, 4.5, 2); g.add(cross);
    } else if (poi.id === 'vecchio') {
      for (var h = 0; h < 4; h++) { var ru = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1 + (h % 2) * 0.6, 1.6), mat(C.stoneDark, true)); ru.position.set((h - 1.5) * 1.9, 0.6, (h % 2) * 1.4); g.add(ru); }
    } else if (poi.id === 'fucino') {
      var deck = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 3), mat(C.path)); deck.position.y = 0.15; g.add(deck);
      var rail = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 0.15), mat(C.trunk)); rail.position.set(0, 0.6, 1.4); g.add(rail);
    } else if (poi.id === 'parco') {
      addTreeTo(g, 0, 0, 1.2); addTreeTo(g, 1.4, 1, 0.9); addTreeTo(g, -1.4, 0.8, 1);
    } else { // piazza
      var sq = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.12, 24), mat(C.path)); sq.position.y = 0.06; g.add(sq);
      var hall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 1.6), mat(C.wall)); hall.position.set(0, 0.9, -1.2); g.add(hall);
      var hroof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 1.8), mat(C.roof)); hroof.position.set(0, 1.95, -1.2); g.add(hroof);
    }
    // marcatore (pin) + etichetta
    var pin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 5), mat(C.marker, true));
    pin.rotation.x = Math.PI; pin.position.y = 7.4; g.add(pin);
    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), mat(C.marker)); ball.position.y = 8; g.add(ball);
    poi._pin = pin; poi._ball = ball;
    var label = makeLabel(poi.label); label.position.y = 9; g.add(label);
    scene.add(g); poi._group = g;
  }
  function addTreeTo(group, x, z, s) {
    var t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1, 6), mat(C.trunk)); t.position.set(x, 0.5, z); group.add(t);
    var c = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 2.2 * s, 7), mat(C.tree, true)); c.position.set(x, 1.8 * s, z); group.add(c);
  }
  function makeLabel(txt) {
    var cv = document.createElement('canvas'); var ctx = cv.getContext('2d');
    var pad = 24; ctx.font = '600 34px Manrope, sans-serif';
    var w = ctx.measureText(txt).width; cv.width = w + pad * 2; cv.height = 64;
    ctx.font = '600 34px Manrope, sans-serif';
    ctx.fillStyle = 'rgba(12,42,30,0.92)'; roundRect(ctx, 0, 0, cv.width, cv.height, 32); ctx.fill();
    ctx.fillStyle = '#f6f0e4'; ctx.textBaseline = 'middle'; ctx.fillText(txt, pad, cv.height / 2 + 2);
    var tex = new THREE.CanvasTexture(cv); tex.anisotropy = 2;
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    spr.scale.set(cv.width / 64 * 1.5, 1.5, 1); spr.renderOrder = 10;
    return spr;
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  POIS.forEach(buildLandmark);

  // Omino (escursionista)
  var hiker = new THREE.Group();
  var legs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.5), mat(0x3a4a3a)); legs.position.y = 0.45; hiker.add(legs);
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 1, 10), mat(C.jacket)); body.position.y = 1.25; hiker.add(body);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), mat(C.skin)); head.position.y = 2.05; hiker.add(head);
  var hat = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.45, 12), mat(C.hat)); hat.position.y = 2.42; hiker.add(hat);
  var brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 12), mat(C.hat)); brim.position.y = 2.2; hiker.add(brim);
  var pack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), mat(C.pack)); pack.position.set(0, 1.3, -0.45); hiker.add(pack);
  hiker.position.set(0, 0, 6); scene.add(hiker);
  // ombra finta
  var shadow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; scene.add(shadow);

  // Stato
  var pos = new THREE.Vector3(0, 0, 6);
  var heading = 0, targetHeading = 0;
  var auto = null; var bob = 0;
  var SPEED = 9, BOUND = 30;

  // Menu collassabile (chiuso di default su mobile)
  var menuBox = root.querySelector('[data-map3d-menubox]');
  var menuToggle = root.querySelector('[data-map3d-menutoggle]');
  if (menuBox && menuToggle) {
    if (window.matchMedia('(max-width: 720px)').matches) { menuBox.classList.add('is-collapsed'); menuToggle.setAttribute('aria-expanded', 'false'); }
    menuToggle.addEventListener('click', function () {
      var collapsed = menuBox.classList.toggle('is-collapsed');
      menuToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  }
  // Menu "Dove vuoi andare?"
  if (menu) {
    POIS.forEach(function (poi) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'map3d__goto'; b.textContent = poi.label;
      b.addEventListener('click', function () {
        auto = poi; hideInfo();
        root.querySelectorAll('.map3d__goto').forEach(function (x) { x.removeAttribute('aria-current'); });
        b.setAttribute('aria-current', 'true');
        if (menuBox && window.matchMedia('(max-width: 720px)').matches) { menuBox.classList.add('is-collapsed'); if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false'); }
      });
      li.appendChild(b); menu.appendChild(li);
    });
  }

  function showInfo(poi) {
    if (!info) return;
    if (infoTitle) infoTitle.textContent = poi.label;
    if (infoText) infoText.textContent = poi.text;
    info.hidden = false;
  }
  function hideInfo() { if (info) info.hidden = true; }
  var closeBtn = root.querySelector('[data-map3d-close]');
  if (closeBtn) closeBtn.addEventListener('click', hideInfo);

  // Resize
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  }
  window.addEventListener('resize', resize);

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var last = performance.now ? performance.now() : 0, running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) loop(0); });

  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    resize();
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;

    var dx = 0, dz = 0;
    if (auto) {
      dx = auto.x - pos.x; dz = (auto.z + 4) - pos.z;
      var dist = Math.hypot(dx, dz);
      if (dist < 0.4) { showInfo(auto); auto = null; dx = dz = 0; }
      else { dx /= dist; dz /= dist; }
    }
    var moving = (dx || dz);
    if (moving) {
      pos.x += dx * SPEED * dt; pos.z += dz * SPEED * dt;
      var r = Math.hypot(pos.x, pos.z); if (r > BOUND) { pos.x *= BOUND / r; pos.z *= BOUND / r; }
      targetHeading = Math.atan2(dx, dz);
    }
    heading += ((targetHeading - heading + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 10);
    hiker.position.x = pos.x; hiker.position.z = pos.z; hiker.rotation.y = heading;
    shadow.position.x = pos.x; shadow.position.z = pos.z;
    // bob + passo
    if (moving && !prefersReduced) { bob += dt * 12; hiker.position.y = Math.abs(Math.sin(bob)) * 0.12; } else hiker.position.y = 0;

    // pin animati (pulsazione)
    var pulse = prefersReduced ? 1 : (1 + Math.sin((now || 0) / 300) * 0.12);
    POIS.forEach(function (p) { if (p._ball) p._ball.scale.setScalar(pulse); });

    // camera segue
    var camTarget = new THREE.Vector3(pos.x - Math.sin(heading) * 2, 0, pos.z - Math.cos(heading) * 2);
    var desired = new THREE.Vector3(pos.x - Math.sin(heading) * 13, 12, pos.z - Math.cos(heading) * 13);
    camera.position.lerp(desired, Math.min(1, dt * 2.4));
    camera.lookAt(pos.x, 1.6, pos.z);

    renderer.render(scene, camera);
  }
  // posizione iniziale camera
  camera.position.set(0, 13, 20); camera.lookAt(0, 1.5, 6);
  resize();
  requestAnimationFrame(loop);
  root.classList.add('map3d--ready');
})();
