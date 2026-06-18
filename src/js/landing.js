/* ─── Pixel Entry Transition ─────────────────────────────────────────────── */
// Skip entry transition on initial landing page load — only play it when arriving from another page.

/* ─── Tag Typewriter Animation ──────────────────────────────────────────────── */
// (function () {
//   const tagIds = ['tag-craft', 'tag-modern', 'tag-design', 'tag-future', 'tag-digital', 'tag-innovation', 'tag-technology'];
//   tagIds.forEach((id, i) => {
//     const el = document.getElementById(id);
//     if (!el) return;
//     const split = SplitText.create(el, { type: 'chars', charsClass: 'char', autoSplit: true });
//     gsap.fromTo(split.chars,
//       { autoAlpha: 0 },
//       { autoAlpha: 1, duration: 0.04, ease: 'none', delay: i * 0.2, stagger: { each: 0.08, from: 'start' } }
//     );
//   });
// })();

/* ─── Tag Hover Background Swap ─────────────────────────────────────────────── */
(function () {
  const layers = [
    document.getElementById('landing-bg-a'),
    document.getElementById('landing-bg-b'),
  ];
  if (!layers[0] || !layers[1]) return;
  let active = 0;

  const tagImageMap = {
    'tag-craft':      'src/img/landing_page/craft.png',
    'tag-modern':     'src/img/landing_page/modern.png',
    'tag-design':     'src/img/landing_page/design.png',
    'tag-future':     'src/img/landing_page/future.png',
    'tag-digital':    'src/img/landing_page/digital.png',
    'tag-innovation': 'src/img/landing_page/innovation.png',
    'tag-technology': 'src/img/landing_page/culture.png',
  };

  function showImage(src) {
    const next = 1 - active;
    layers[next].style.backgroundImage = `url(${src})`;
    layers[next].style.opacity = '1';
    layers[active].style.opacity = '0';
    active = next;
  }

  Object.entries(tagImageMap).forEach(([tagId, imgSrc]) => {
    const tag = document.getElementById(tagId);
    if (!tag) return;
    tag.addEventListener('mouseenter', () => showImage(imgSrc));
  });
})();

/* ─── Landing Page Connector Lines ───────────────────────────────────────────── */
(function () {
  const svg = document.getElementById('landing-lines');
  if (!svg) return;

  const links = [
    ['tag-craft',       'ltr-craft',       'bottom', { shorten: 75,  rotate: -25 }],
    ['tag-modern',      'ltr-modern',      'bottom', { shorten: 85,  shiftX: 8,  rotate: -6 }],
    ['tag-design',      'ltr-design',      'bottom', { shorten: 75,  rotate: 5 }],
    ['tag-future',      'ltr-future',      'bottom', { shorten: 72, rotate: 2 }],
    ['tag-digital',     'ltr-digital',     'top',    { shorten: -5,  rotate: 2 }],
    ['tag-innovation',  'ltr-innovation',  'top',    { shorten: 5,   shiftX: -13, rotate: -10 }],
    ['tag-technology',  'ltr-technology',  'top',    { shorten: -3,  rotate: 0 }],
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
    /* ── auto-centre the staircase block within the container ── */
    const lines = Array.from(heading.querySelectorAll('.landing-line'));
    if (lines.length) {
      const overlay = document.getElementById('landing-overlay');
      const ow = overlay.offsetWidth;
      const oh = overlay.offsetHeight;
      let minL = Infinity, maxR = -Infinity, minT = Infinity, maxB = -Infinity;
      lines.forEach(l => {
        const r = l.getBoundingClientRect();
        minL = Math.min(minL, r.left);
        maxR = Math.max(maxR, r.right);
        minT = Math.min(minT, r.top);
        maxB = Math.max(maxB, r.bottom);
      });
      const contentCX = (minL + maxR) / 2;
      const contentCY = (minT + maxB) / 2;
      const screenCX  = ow / 2;
      const screenCY  = oh / 2;
      const dx = screenCX - contentCX;
      const dy = screenCY - contentCY;
      const hRect = heading.getBoundingClientRect();
      heading.style.left = (hRect.left + hRect.width  / 2 + dx) + 'px';
      heading.style.top  = (hRect.top  + hRect.height / 2 + dy + 45) + 'px';
      heading.style.transform = 'translate(-50%, -50%)';
    }

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
  const overlay = document.getElementById('landing-overlay');
  let transitioning = false;

  overlay.addEventListener('click', () => {
    if (transitioning) return;
    transitioning = true;
    PixelTransition.navigateTo('gallery.html');
  });
})();

/* ─── Scroll down to reveal about sections ───────────────────────────────── */
(function () {
  const overlay = document.getElementById('landing-overlay');
  if (!overlay) return;
  let dismissed = false;

  function dismissLanding() {
    if (dismissed) return;
    dismissed = true;
    gsap.to(overlay, {
      y: '-100%',
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => { overlay.style.pointerEvents = 'none'; },
    });
  }

  // document-level so the event fires regardless of which child is under the cursor
  document.addEventListener('wheel', (e) => {
    if (!dismissed && e.deltaY > 0) dismissLanding();
  }, { passive: true });
})();

/* ─── Video Sound Toggle ─────────────────────────────────────────────────── */
(function () {
  const video = document.getElementById('about-video');
  const btn   = document.getElementById('video-sound-btn');
  if (!video || !btn) return;
  btn.addEventListener('click', () => {
    video.muted = !video.muted;
    btn.textContent = video.muted ? '[ Sound Off ]' : '[ Sound On ]';
    btn.classList.toggle('sound-on', !video.muted);
  });
})();

/* ─── Reset video to start each time about-entry enters the viewport ─────── */
(function () {
  const video = document.getElementById('about-video');
  if (!video) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.currentTime = 0;
        video.play();
      }
    });
  }, { threshold: 0.1 });
  observer.observe(video.closest('section') || video);
})();

