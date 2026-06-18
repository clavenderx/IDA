(function () {
  const SQ = 100;

  function buildTiles(container) {
    container.innerHTML = '';
    const cols = Math.ceil(window.innerWidth  / SQ);
    const rows = Math.ceil(window.innerHeight / SQ);
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;top:0;left:0;display:flex;flex-wrap:wrap;width:${cols * SQ}px;height:${rows * SQ}px;pointer-events:none;`;
    const tiles = [];
    for (let i = 0; i < cols * rows; i++) {
      const tile = document.createElement('div');
      tile.style.cssText = `width:${SQ}px;height:${SQ}px;background:var(--color-charcoal,#1e1e1e);flex-shrink:0;`;
      wrap.appendChild(tile);
      tiles.push(tile);
    }
    container.appendChild(wrap);
    return tiles;
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

  /* Fill IN — tiles appear randomly (use for: page exit, overlay open) */
  function fillIn({ container, duration = 0.5, onComplete } = {}) {
    const el = getContainer(container);
    el.style.pointerEvents = 'all';
    const tiles = buildTiles(el);
    gsap.set(tiles, { opacity: 0 });
    gsap.to(tiles, {
      opacity: 1,
      duration: 0.0005,
      stagger: { amount: duration, from: 'random' },
      onComplete: onComplete || null,
    });
    return tiles;
  }

  /* Fill OUT — tiles disappear randomly (use for: page entry, overlay close) */
  function fillOut({ container, duration = 0.4, onComplete } = {}) {
    const el = getContainer(container);
    const tiles = buildTiles(el);
    gsap.set(tiles, { opacity: 1 });
    gsap.to(tiles, {
      opacity: 0,
      duration: 0.0005,
      stagger: { amount: duration, from: 'random' },
      onComplete: () => {
        el.innerHTML = '';
        el.style.pointerEvents = 'none';
        if (onComplete) onComplete();
      },
    });
    return tiles;
  }

  /* Navigate to href after pixel fill-in */
  function navigateTo(href, duration = 0.5) {
    fillIn({ duration, onComplete: () => { window.location.href = href; } });
  }

  window.PixelTransition = { fillIn, fillOut, navigateTo };
})();
