/* ─── Landing Page Connector Lines ───────────────────────────────────────────── */
(function () {
  const svg = document.getElementById('landing-lines');
  if (!svg) return;

  const links = [
    ['tag-craft', 'ltr-craft', 'bottom', { shorten: 20, rotate: -20, shortenFrac: 0.35 }],
    ['tag-modern', 'ltr-modern', 'bottom', { shiftX: 8, shorten: 40, shortenFrac: 0.2 }],
    ['tag-design', 'ltr-design', 'bottom', { shorten: 35, rotate: 5, shortenFrac: 0.35 }],
    ['tag-future', 'ltr-future', 'bottom', { shorten: 50, shortenFrac: 0.2 }],
    ['tag-digital', 'ltr-digital', 'top', { shorten: 50, rotate: 7, lengthenFrac: 0.45, shiftX: -28 }],
    ['tag-innovation', 'ltr-innovation', 'top', { shorten: 55, shiftX: 7, rotate: -10, lengthenFrac: 0.45 }],
    ['tag-technology', 'ltr-technology', 'top', { shorten: 40, rotate: -10, lengthenFrac: 0.45, endShiftX: 20 }],
  ];

  function drawLines() {
    const overlayRect = document.getElementById('landing-overlay').getBoundingClientRect();
    svg.innerHTML = '';

    links.forEach(([tagId, letterId, tagSide, opts]) => {
      const tag = document.getElementById(tagId);
      const letter = document.getElementById(letterId);
      if (!tag || !letter) return;

      const { shorten = 0, shiftX = 0, rotate = 0, shortenFrac = 0, lengthenFrac = 0, endShiftX = 0 } = opts || {};

      const tagRect = tag.getBoundingClientRect();
      const letterRect = letter.getBoundingClientRect();

      let x1 = tagRect.left + tagRect.width / 2 - overlayRect.left;
      let y1 = (tagSide === 'bottom' ? tagRect.bottom : tagRect.top) - overlayRect.top;
      let x2 = letterRect.left + letterRect.width / 2 - overlayRect.left;
      let y2 = letterRect.top + letterRect.height / 2 - overlayRect.top;

      if (shorten) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          x2 -= (dx / len) * shorten;
          y2 -= (dy / len) * shorten;
        }
      }

      if (shortenFrac) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        x2 -= dx * shortenFrac;
        y2 -= dy * shortenFrac;
      }

      if (lengthenFrac) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        x2 += dx * lengthenFrac;
        y2 += dy * lengthenFrac;
      }

      if (rotate) {
        const a = (rotate * Math.PI) / 180;
        const dx = x2 - x1;
        const dy = y2 - y1;
        x2 = x1 + dx * Math.cos(a) - dy * Math.sin(a);
        y2 = y1 + dx * Math.sin(a) + dy * Math.cos(a);
      }

      x1 += shiftX;
      x2 += shiftX;
      x2 += endShiftX;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      svg.appendChild(line);
    });
  }

  window.addEventListener('load', drawLines);
  window.addEventListener('resize', drawLines);

  /* ─── Mouse parallax on the surrounding tags ───────────────────────────── */
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (x, a, b, c, d) => c + ((x - a) * (d - c)) / (b - a);
  const rand = (a, b) => a + Math.random() * (b - a);

  let winW = window.innerWidth;
  let winH = window.innerHeight;
  let mouse = { x: winW / 2, y: winH / 2 };

  const tagItems = links.map(([tagId]) => {
    const el = document.getElementById(tagId);
    return el && {
      el,
      tx: 0,
      ty: 0,
      xRange: rand(8, 16),
      yRange: rand(8, 16),
    };
  }).filter(Boolean);

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('resize', () => {
    winW = window.innerWidth;
    winH = window.innerHeight;
  });

  function tick() {
    tagItems.forEach((item) => {
      item.tx = lerp(item.tx, map(mouse.x, 0, winW, -item.xRange, item.xRange), 0.06);
      item.ty = lerp(item.ty, map(mouse.y, 0, winH, -item.yRange, item.yRange), 0.06);
      item.el.style.transform = `translate(${item.tx}px, ${item.ty}px)`;
    });
    drawLines();
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ─── Pixel Grid Heading Effect ─────────────────────────────────────────────── */
(function () {
  const heading = document.getElementById('landing-heading');
  if (!heading) return;
  const TILE = 75;

  document.fonts.ready.then(() => {
    const W   = heading.offsetWidth;
    const H   = heading.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    const RIGHT_BLEED = 220; /* extra canvas width to capture the PP Eiko italic "5" tail */

    /* 1. append canvas first so its getBoundingClientRect matches the DOM text rects */
    const canvas = document.createElement('canvas');
    canvas.width  = (W + RIGHT_BLEED) * dpr;
    canvas.height = H * dpr;
    canvas.style.cssText = `position:absolute;top:0;left:0;width:${W + RIGHT_BLEED}px;height:${H}px;pointer-events:auto;`;
    heading.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    /* 2. offscreen canvas — padded by one tile so boundary tiles never clip/stretch */
    const off = document.createElement('canvas');
    off.width  = W + RIGHT_BLEED + TILE;
    off.height = H + TILE;
    const oc  = off.getContext('2d');
    const cRect = canvas.getBoundingClientRect();

    function walkAndDraw(node) {
      if (node.nodeType === 3) {
        const text = node.textContent;
        if (!text.trim()) return;
        const range = document.createRange();
        range.selectNode(node);
        const r = range.getBoundingClientRect();
        if (r.width === 0) return;
        const cs = window.getComputedStyle(node.parentElement);
        const ff = cs.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
        oc.font         = `${cs.fontStyle !== 'normal' ? cs.fontStyle + ' ' : ''}${cs.fontWeight} ${cs.fontSize} "${ff}"`;
        oc.fillStyle    = cs.color;
        oc.textBaseline = 'alphabetic';
        const m  = oc.measureText(text);
        const x  = r.left - cRect.left;
        const y  = r.top  - cRect.top + m.actualBoundingBoxAscent;
        oc.fillText(text, x, y);
      } else if (node.nodeType === 1 && node.tagName !== 'CANVAS') {
        node.childNodes.forEach(walkAndDraw);
      }
    }
    walkAndDraw(heading);

    /* 3. hide DOM text now that offscreen canvas has captured the colors */
    function hideText(node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        node.parentElement.style.color = 'transparent';
      } else if (node.nodeType === 1 && node.tagName !== 'CANVAS') {
        node.childNodes.forEach(hideText);
      }
    }
    hideText(heading);

    /* 4. tile grid */
    const cols = Math.ceil((W + RIGHT_BLEED) / TILE);
    const rows = Math.ceil(H / TILE);
    const tiles = Array.from({ length: cols * rows }, (_, i) => ({
      c: i % cols, r: Math.floor(i / cols),
      ox: 0, oy: 0,
    }));

    let mx = -9999, my = -9999;
    let prevMx = -9999, prevMy = -9999;
    let vx = 0, vy = 0;

    canvas.addEventListener('mousemove', e => {
      const cr = canvas.getBoundingClientRect();
      mx = e.clientX - cr.left;
      my = e.clientY - cr.top;
    });
    canvas.addEventListener('mouseleave', () => {
      mx = -9999; my = -9999;
      prevMx = -9999; prevMy = -9999;
    });

    (function tick() {
      if (mx !== -9999) {
        if (prevMx !== -9999) {
          vx = mx - prevMx;
          vy = my - prevMy;
        }
        prevMx = mx;
        prevMy = my;
      } else {
        vx *= 0.94;
        vy *= 0.94;
      }

      ctx.clearRect(0, 0, W + RIGHT_BLEED, H);
      tiles.forEach(tile => {
        const cx   = tile.c * TILE + TILE * 0.5;
        const cy   = tile.r * TILE + TILE * 0.5;
        const dist = Math.hypot(cx - mx, cy - my);
        const infl = Math.max(0, 1 - dist / (TILE * 3.5));
        const targetX = vx * 5 * infl;
        const targetY = vy * 5 * infl;
        tile.ox += (targetX - tile.ox) * 0.055;
        tile.oy += (targetY - tile.oy) * 0.055;
        ctx.drawImage(off,
          tile.c * TILE, tile.r * TILE, TILE, TILE,
          tile.c * TILE + tile.ox, tile.r * TILE + tile.oy, TILE, TILE
        );
      });
      requestAnimationFrame(tick);
    })();
  });
})();

/* ─── Landing Page ───────────────────────────────────────────────────────────── */
(function () {
  const overlay   = document.getElementById('landing-overlay');
  const container = document.getElementById('square_container');
  const SQ = 100;
  let squares = [];
  let transitioning = false;

  function buildSquares() {
    container.innerHTML = '';
    squares = [];
    const cols = Math.ceil(window.innerWidth  / SQ);
    const rows = Math.ceil(window.innerHeight / SQ);
    container.style.width  = cols * SQ + 'px';
    container.style.height = rows * SQ + 'px';
    for (let i = 0; i < cols * rows; i++) {
      const sq = document.createElement('div');
      sq.className = 'square';
      container.appendChild(sq);
      squares.push(sq);
    }
  }

  overlay.addEventListener('click', () => {
    if (transitioning) return;
    transitioning = true;
    buildSquares();

    gsap.fromTo(squares, { opacity: 0 }, {
      opacity: 1,
      delay: 0.5,
      duration: 0.0005,
      stagger: { each: 0.004, from: 'random' },
    });

    gsap.to(squares, {
      opacity: 0,
      delay: 1.5,
      duration: 0.0005,
      stagger: { each: 0.004, from: 'random' },
    });

    gsap.to(overlay, {
      opacity: 0,
      delay: 1.15,
      duration: 0.3,
      onComplete: () => {
        window.location.href = 'gallery.html';
      },
    });
  });
})();
