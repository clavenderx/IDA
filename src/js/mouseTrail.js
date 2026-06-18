/* ─── Mouse Trail (global) ──────────────────────────────────────────────────── */
(function () {
  const MT_GRID = 24, MT_MAX = 50, MT_DUR = 1000;
  let mtGrid = [], mtActive = [], mtPrevX = null, mtPrevY = null;

  function mtInitGrid() {
    mtGrid = [];
    const cols = Math.floor(window.innerWidth  / MT_GRID);
    const rows = Math.floor(window.innerHeight / MT_GRID);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        mtGrid.push({
          x: c * MT_GRID, y: r * MT_GRID,
          ex: (c + 1) * MT_GRID - 1, ey: (r + 1) * MT_GRID - 1,
        });
  }

  function mtPoints(x1, y1, x2, y2) {
    const pts = [], dx = x2 - x1, dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) / MT_GRID;
    for (let i = 0; i <= steps; i++) {
      const t = steps > 0 ? i / steps : 0;
      pts.push({ x: Math.round(x1 + dx * t), y: Math.round(y1 + dy * t) });
    }
    return pts;
  }

  function mtDraw(x, y) {
    if (mtActive.some(e => e.dataset.pos === `${x},${y}`)) return;
    if (mtActive.length >= MT_MAX) { const o = mtActive.shift(); o.remove(); }
    const el = document.createElement('div');
    el.className   = 'mt-block';
    el.style.left  = x + 'px';
    el.style.top   = y + 'px';
    el.dataset.pos = `${x},${y}`;
    document.body.appendChild(el);
    mtActive.push(el);
    setTimeout(() => {
      el.remove();
      const i = mtActive.indexOf(el);
      if (i !== -1) mtActive.splice(i, 1);
    }, MT_DUR);
  }

  window.addEventListener('mousemove', e => {
    const cx = e.clientX, cy = e.clientY;
    if (mtPrevX !== null) {
      mtPoints(mtPrevX, mtPrevY, cx, cy).forEach(({ x, y }) => {
        const b = mtGrid.find(b => x >= b.x && x <= b.ex && y >= b.y && y <= b.ey);
        if (b) mtDraw(b.x, b.y);
      });
    }
    mtPrevX = cx;
    mtPrevY = cy;
  });

  mtInitGrid();
  window.addEventListener('resize', mtInitGrid);
})();

/* ─── Nav colour per-link based on element underneath ───────────────────────── */
(function () {
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  const page = location.pathname.split('/').pop();
  if (page !== 'projectLaufElja.html') return;

  const links = Array.from(nav.querySelectorAll('a'));
  if (!links.length) return;

  function isLight(el) {
    while (el && el !== document.documentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      const m  = bg.match(/\d+/g);
      if (!m) { el = el.parentElement; continue; }
      const [r, g, b, a] = m.map(Number);
      if ((a === undefined || a > 0) && !(r === 0 && g === 0 && b === 0)) {
        /* luminance threshold — treat as light if above ~0.5 */
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return lum > 0.6;
      }
      el = el.parentElement;
    }
    return false;
  }

  function check() {
    /* temporarily hide nav so elementsFromPoint sees what's underneath */
    nav.style.pointerEvents = 'none';
    nav.style.visibility    = 'hidden';

    links.forEach(link => {
      const r  = link.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const els = document.elementsFromPoint(cx, cy);
      const under = els.find(e => !nav.contains(e) && e !== nav);
      const light = under ? isLight(under) : false;
      link.classList.toggle('nav-on-light', light);
    });

    nav.style.visibility    = '';
    nav.style.pointerEvents = '';
  }

  window.addEventListener('scroll', check, { passive: true });
  const hTrack = document.querySelector('.detail-track');
  if (hTrack) hTrack.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  requestAnimationFrame(check);
})();

/* ─── Active nav link ────────────────────────────────────────────────────────── */
(function () {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#site-nav a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === current) a.classList.add('nav-active');
  });
})();
