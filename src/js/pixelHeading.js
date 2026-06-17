/**
 * Pixel grid heading effect — tiles the rendered text onto a canvas and
 * displaces tiles based on mouse velocity for a liquify-on-hover feel.
 *
 * @param {HTMLElement} heading - The container element whose text to pixelate
 * @param {number} [tileSize=75] - Size of each tile in px
 */
export const initPixelHeading = (heading, tileSize = 75) => {
  if (!heading) return;
  const TILE = tileSize;

  document.fonts.ready.then(() => {
    const W = heading.offsetWidth;
    const H = heading.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    const RIGHT_BLEED = 220; // capture italic tails
    const TOP_BLEED   = 40;  // capture ascenders that overflow above the div

    const canvas = document.createElement('canvas');
    canvas.width  = (W + RIGHT_BLEED) * dpr;
    canvas.height = (H + TOP_BLEED) * dpr;
    // Shift the canvas up by TOP_BLEED so it covers above the heading div
    canvas.style.cssText = `position:absolute;top:${-TOP_BLEED}px;left:0;width:${W + RIGHT_BLEED}px;height:${H + TOP_BLEED}px;pointer-events:auto;`;
    heading.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Offscreen canvas — extra padding all round so boundary tiles never clip
    const off = document.createElement('canvas');
    off.width  = W + RIGHT_BLEED + TILE;
    off.height = H + TOP_BLEED + TILE;
    const oc = off.getContext('2d');
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
        const m = oc.measureText(text);
        // x/y are relative to the canvas top-left (which is TOP_BLEED above the div)
        const x = r.left - cRect.left;
        const y = r.top  - cRect.top + m.actualBoundingBoxAscent;
        oc.fillText(text, x, y);
      } else if (node.nodeType === 1 && node.tagName !== 'CANVAS') {
        node.childNodes.forEach(walkAndDraw);
      }
    }
    walkAndDraw(heading);

    function hideText(node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        node.parentElement.style.color = 'transparent';
      } else if (node.nodeType === 1 && node.tagName !== 'CANVAS') {
        node.childNodes.forEach(hideText);
      }
    }
    hideText(heading);

    const cols = Math.ceil((W + RIGHT_BLEED) / TILE);
    const rows = Math.ceil((H + TOP_BLEED) / TILE);
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

    const totalW = W + RIGHT_BLEED;
    const totalH = H + TOP_BLEED;

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

      ctx.clearRect(0, 0, totalW, totalH);
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
};
