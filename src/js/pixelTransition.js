(function () {
  const BASE = 50;
  const SPANS = [1, 1, 1, 2, 2, 3];

  const TILE_COLORS = [
    'var(--color-blue,#0277B8)',
    'var(--color-light-green,#C3FA95)',
    'var(--color-charcoal,#1E1E1E)',
  ];

  function generateLayout(cols, rows, colors = TILE_COLORS, tileOpacityFn = null) {
    const filled = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const layout = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (filled[r][c]) continue;
        let span = SPANS[Math.floor(Math.random() * SPANS.length)];
        while (span > 1) {
          if (r + span > rows || c + span > cols) { span--; continue; }
          let ok = true;
          outer: for (let dr = 0; dr < span; dr++) {
            for (let dc = 0; dc < span; dc++) {
              if (filled[r + dr][c + dc]) { ok = false; break outer; }
            }
          }
          if (ok) break;
          span--;
        }
        for (let dr = 0; dr < span; dr++)
          for (let dc = 0; dc < span; dc++)
            filled[r + dr][c + dc] = true;
        const color = colors[Math.floor(Math.random() * colors.length)];
        layout.push({
          c, r, span, color,
          opacity: tileOpacityFn ? tileOpacityFn(color) : 1,
        });
      }
    }
    return layout;
  }

  function buildTiles(container, savedLayout, { colors, overlayOpacity, tileOpacityFn } = {}) {
    container.innerHTML = '';
    if (overlayOpacity != null) container.style.opacity = overlayOpacity;
    const cols = Math.ceil(window.innerWidth  / BASE);
    const rows = Math.ceil(window.innerHeight / BASE);
    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:absolute;top:0;left:0;pointer-events:none;',
      `width:${cols * BASE}px;height:${rows * BASE}px;`,
      `display:grid;`,
      `grid-template-columns:repeat(${cols},${BASE}px);`,
      `grid-template-rows:repeat(${rows},${BASE}px);`,
    ].join('');

    const layout = savedLayout || generateLayout(cols, rows, colors, tileOpacityFn);
    const tiles = [];

    for (const { c, r, span, color, opacity } of layout) {
      const tile = document.createElement('div');
      tile.style.cssText = [
        `grid-column:${c + 1}/span ${span};`,
        `grid-row:${r + 1}/span ${span};`,
        `background:${color};opacity:${opacity};`,
      ].join('');
      tile.dataset.baseOpacity = opacity;
      wrap.appendChild(tile);
      tiles.push(tile);
    }

    container.appendChild(wrap);
    return { tiles, layout };
  }

  function getContainer(el) {
    if (el) return el;
    let c = document.getElementById('pixel-transition-overlay');
    if (!c) {
      c = document.createElement('div');
      c.id = 'pixel-transition-overlay';
      c.style.cssText = 'position:fixed;inset:0;z-index:9000;pointer-events:none;';
      document.body.appendChild(c);
    }
    return c;
  }

  /* Fill IN — tiles fade in one by one; layout is saved to sessionStorage for the next page */
  function fillIn({ container, duration = 0.8, tileFade = 0.18, colors, overlayOpacity, tileOpacityFn, onComplete } = {}) {
    const el = getContainer(container);
    el.style.pointerEvents = 'all';
    const { tiles, layout } = buildTiles(el, null, { colors, overlayOpacity, tileOpacityFn });
    if (!container) sessionStorage.setItem('px-layout', JSON.stringify(layout));
    gsap.set(tiles, { opacity: 0 });
    gsap.to(tiles, {
      opacity: (i) => parseFloat(tiles[i].dataset.baseOpacity),
      duration: tileFade,
      ease: 'power1.in',
      stagger: { amount: duration, from: 'random' },
      onComplete: onComplete || null,
    });
    return tiles;
  }

  /* Fill OUT — fades the overlay out; rebuilds mosaic unless rebuild:false */
  function fillOut({ container, duration = 0.7, colors, overlayOpacity, rebuild = true, onComplete } = {}) {
    const el = getContainer(container);
    el.style.pointerEvents = 'all';
    if (rebuild) {
      const saved = !container && sessionStorage.getItem('px-layout');
      if (saved) sessionStorage.removeItem('px-layout');
      buildTiles(el, saved ? JSON.parse(saved) : null, { colors, overlayOpacity });
    }
    gsap.set(el, { opacity: overlayOpacity != null ? overlayOpacity : 1 });
    gsap.to(el, {
      opacity: 0,
      duration,
      ease: 'power2.inOut',
      onComplete: () => {
        el.innerHTML = '';
        el.style.opacity = '';
        el.style.pointerEvents = 'none';
        if (onComplete) onComplete();
      },
    });
  }

  /* Navigate: build mosaic on current page then switch — html background prevents white flash */
  function navigateTo(href, durationIn = 0.8) {
    fillIn({
      duration: durationIn,
      onComplete: () => { window.location.href = href; },
    });
  }

  window.PixelTransition = { fillIn, fillOut, navigateTo };
})();
